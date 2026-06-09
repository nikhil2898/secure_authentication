// Interceptor creates the new accessToken using refreshToken after expired without logging out user

import axios from "axios"


const server = "http://localhost:3000"


const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}

const api = axios.create({
    baseURL : server,
    withCredentials : true,
});

api.interceptors.request.use((config) => {
    if(config.method === "post" || config.method === 'put' || config.method === 'delete' || config.method === 'patch'){
        const csrfToken = getCookie("csrfToken");
        // console.log("All cookies:", document.cookie);
        // console.log(csrfToken);
        if(csrfToken) {
            config.headers["x-csrf-token"] = csrfToken;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
})

let isRefreshing = false;
let isRefreshingCsrfToken = false;
let failedQueue = [];
let csrfFailedQueue = [];

const processQueue = (error,token=null) => {
    failedQueue.forEach((prom) => {
        if(error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    })

    failedQueue = [];
}

const csrfProcessQueue = (error, token = null) => {
  csrfFailedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  csrfFailedQueue = [];
};

// creating interceptor
api.interceptors.response.use((response) => response, async(error) => {
    const originalRequest = error.config;

    if(error.response?.status === 403 && !originalRequest._retry ) {
        const errorCode = error.response.data?.code || "";

        if(errorCode.startsWith("CSRF_")) {
            if(isRefreshingCsrfToken) {
                return new Promise((resolve,reject) => {
                    csrfFailedQueue.push({resolve,reject})
                }).then(()=>api(originalRequest))
            }
            originalRequest._retry = true;
            isRefreshingCsrfToken = true;

            try {
                await api.post("/api/auth/refresh-csrf");
                csrfProcessQueue(null)
                return api(originalRequest)
            } catch (error) {
                csrfProcessQueue(error);
                console.error("failed to refresh csrf token", error)
                return Promise.reject(error);
            } finally {
                isRefreshingCsrfToken = false;
            }
        }


       if(isRefreshing) {
        return new Promise((resolve,reject)=> {
            failedQueue.push({resolve,reject})
        }).then(()=>{
            return api(originalRequest);
        });
       }

       originalRequest._retry = true;
       isRefreshing = true;

       try {
        await api.post("/api/auth/refresh");
        processQueue(null)
        return api(originalRequest);
       } catch (error) {
         processQueue(error,null);
         return Promise.reject(error)
       } finally {
        isRefreshing = false;
       }
    }
    return Promise.reject(error);
})

export default api;