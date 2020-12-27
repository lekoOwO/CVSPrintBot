import _axios from 'axios';
import FormData from 'form-data';

const axios = _axios.create({
    headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'}
});

export class Ibon {
    constructor(options) {
        this.user = options?.user || "逼比";
        this.email = options?.email || "bibi1069@bibi.com";
    }

    #baseUrl = new URL("https://printadmin.ibon.com.tw/IbonUpload/");
    #hash;
    #result;

    #isValidResult(res) {
        return res.data.ResultCode === "00"
    }

    async #getHash() {
        if (this.#hash) {
            return this.#hash;
        } else {
            const url = new URL("IbonUpload/FileUpload", this.#baseUrl);
            const res = await axios.post(url.toString(), { hash: "" });

            if (!this.#isValidResult(res)) {
                throw new Error("Get hash error!")
            }

            this.#hash = res.data.Hash;
            return this.#hash;
        }
    }

    async #getResult() {
        if (this.#result) {
            return this.#result;
        } else {
            const url = new URL("IbonUpload/IbonFileUpload", this.#baseUrl);
            const res = await axios.post(url.toString(), {
                hash: await this.#getHash(),
                user: this.user,
                email: this.email
            });

            if (!this.#isValidResult(res)) {
                throw new Error("Get result error!")
            }

            this.#result = res.data;
            return this.#result;
        }
    }

    async upload(file) {
        const url = new URL("IbonUpload/LocalFileUpload", this.#baseUrl);

        const payload = new FormData();
        payload.append("fileName", file.name);
        payload.append("hash", await this.#getHash());
        payload.append("file", file.file);

        const res = await axios.post(url.toString(), payload, {
            headers: {
                ...payload.getHeaders()
            }
        });
        if (!this.#isValidResult(res)) {
            throw new Error("File upload error!")
        }

        const result = await this.#getResult();
        return {
            pin: result.Pincode,
            expiry: result.DeadLine,
            image: Buffer.from(result.FileQrcode, "base64")
        }
    }
}