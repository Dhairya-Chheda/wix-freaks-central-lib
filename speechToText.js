import axios from 'axios';
import { getSecret } from 'wix-secrets-backend'
const FormData = require('form-data');

export async function generateTextFromAudio(url) {

    const endpoint = "https://api.openai.com/v1/audio/transcriptions";// you can replace the endpoint with any other llm speech to text model.
    const apiKey = await getSecret("OPENAI_API_KEY");

    try {
        
        const fileResponse = await axios({
            method: "get",
            url,
            responseType: 'arraybuffer'
        })

        const formData = new FormData();
        formData.append('file', Buffer.from(fileResponse.data),"testAudio.mp3");
        formData.append('model', 'whisper-1');

        const textResponse = await axios.post(endpoint, formData, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                ...formData.getHeaders(),
            }
        })

        return textResponse.data;

    } catch (error) {
        console.log("Error in backend: ", error);
    }
}