import _axios from 'axios';
import _axiosCookieJarSupport from "axios-cookiejar-support";
import * as tough from 'tough-cookie';
import FormData from 'form-data';
import * as cheerio from "cheerio";
import {resolve} from "url"

const axiosCookieJarSupport = _axiosCookieJarSupport.default

function axiosFactory() {
    const axios = _axios.create({
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36' },
        withCredentials: true
    })
    axiosCookieJarSupport(axios);
    axios.defaults.jar = new tough.CookieJar();
    return axios;
}

export class Fami {
    constructor(email = "bb@bb.com") {
        this.email = email;
    }

    #axios = axiosFactory();
    #baseUrl = new URL("https://www.famiport.com.tw/Web_Famiport/page/");

    async #get() {
        const url = new URL("cloudprint_ok.aspx", this.#baseUrl);

        const res = await this.#axios.get(url.toString());

        const $ = cheerio.load(res.data);

        const pin = $("#ctl00_ContentPlaceHolder1_LabPINCODE").text()
        const expiry = $("#ctl00_ContentPlaceHolder1_LabVALID_END_DATE").text()
        const picRelUrl = $("#ctl00_ContentPlaceHolder1_QRimg").attr("src");
        const picUrl = resolve(url.toString(), picRelUrl);

        const picBuffer = (await this.#axios.get(picUrl, { responseType: "arraybuffer" })).data;

        return {
            pin, expiry,
            image: picBuffer
        }
    }

    async upload(file) {
        const url = new URL("cloudprint.aspx", this.#baseUrl);

        const x = await this.#axios.get(url.toString());
        const $ = cheerio.load(x.data);
        
        const payload = new FormData();
        payload.append("ctl00$ContentPlaceHolder1$txtEmail", this.email)
        payload.append("ctl00$ContentPlaceHolder1$FileLoad", file.file, {filename: file.name})
        payload.append("ctl00$ContentPlaceHolder1$CKbox", "on")
        payload.append("__VIEWSTATE", $("#__VIEWSTATE").val())
        payload.append("ctl00$ContentPlaceHolder1$btnSave", $("#ctl00_ContentPlaceHolder1_btnSave").val())
        payload.append("__VIEWSTATEGENERATOR", $("#__VIEWSTATEGENERATOR").val())
        payload.append("__EVENTVALIDATION", $("#__EVENTVALIDATION").val())

        const res = await this.#axios.post(url.toString(), payload, {
            headers: {
                ...payload.getHeaders()
            }
        });

        if (res.status != 200) {
            throw new Error("File upload error!")
        }

        return await this.#get();
    }
}