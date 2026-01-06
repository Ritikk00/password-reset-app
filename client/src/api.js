import axios from 'axios';

const API = axios.create({
    // Ab aapko sirf yahan URL badalna hoga agar kabhi badla toh
    baseURL: 'https://password-reset-app-2cai.onrender.com/api'
});

export default API;