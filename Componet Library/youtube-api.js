import { Permissions, webMethod } from "wix-web-module";
import { fetch } from "wix-fetch"
import wixSecretsBackend from "wix-secrets-backend";

export const getAllPublicChannelVideos = webMethod(
    Permissions.Anyone,
    async (nextPage, noOfResuslts) => {

        try {
            const apiKey = await wixSecretsBackend.getSecret('GOOGLE_API_KEY');

            const channelId = await wixSecretsBackend.getSecret('YOUTUBE_CHANNELID');

            const playlistId = `UU${channelId.substring(2)}`.trim();

            let url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&maxResults=${noOfResuslts}&part=snippet`

            if (nextPage) {
                url = `${url}&pageToken=${nextPage}`
            }

            return fetch(url)
                .then((res) => res.json())
                .then((res) => {
                    console.log(url);
                    console.log(res);
                    const data = {
                        items: res.items,
                        nextPage: res.nextPageToken,
                        prevPage: res?.prevPageToken || null,
                        pageInfo: res.pageInfo,
                    }
                    return data;
                })
                .catch(e => console.log('Error in youtube API call: ', e));
        } catch (err) {
            console.log('Error in Get Videos:', err);
            return {
                errorMessage: err
            }
        }
    }
);