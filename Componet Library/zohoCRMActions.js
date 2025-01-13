import { webMethod, Permissions } from "wix-web-module";
import wixFetch from 'wix-fetch';

const webhookURL = "https://flow.zoho.com/751944202/flow/webhook/incoming?zapikey=1001.6c41f53195395b678592392b503b768e.3a51b12dac1e4a7ff5209986012d64a2&isdebug=false";

export const sendDataCRM = webMethod(Permissions.Anyone, async (data) => {

  try {
    
    const fetchResp = await wixFetch.fetch(webhookURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if(fetchResp.ok){
      return Promise.resolve("Data posted successfully");
    }

    const respData = await fetchResp.text();
    return Promise.reject(respData);
    
    
  } catch (error) {
    return Promise.reject(error);
  }

});