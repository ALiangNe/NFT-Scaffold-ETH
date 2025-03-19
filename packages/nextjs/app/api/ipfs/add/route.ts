// import { ipfsClient } from "~~/utils/simpleNFT/ipfs";

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const res = await ipfsClient.add(JSON.stringify(body));
//     return Response.json(res);
//   } catch (error) {
//     console.log("Error adding to ipfs", error);
//     return Response.json({ error: "Error adding to ipfs" });
//   }
// }

import axios from "axios";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // 处理文件上传
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
      }

      const pinataApiKey = '9b9b9dc33d2d2eabf245';
      const pinataSecretApiKey = 'b32a04b017d67b6691d1960f9717bc553df02a53983a8733da740dc8c458b88f';

      const data = new FormData();
      data.append("file", file);

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
        headers: {
          'Content-Type': `multipart/form-data`,
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
        },
      });

      const ipfsHash = res.data.IpfsHash;
      return new Response(JSON.stringify({ IpfsHash: ipfsHash }), { status: 200 });
    } else if (contentType.includes("application/json")) {
      // 处理 JSON 上传
      const body = await request.json();

      const pinataApiKey = '9b9b9dc33d2d2eabf245';
      const pinataSecretApiKey = 'b32a04b017d67b6691d1960f9717bc553df02a53983a8733da740dc8c458b88f';

      const data = {
        pinataContent: body,
      };

      const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretApiKey,
        },
      });

      const ipfsHash = res.data.IpfsHash;
      return new Response(JSON.stringify({ IpfsHash: ipfsHash }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: "Unsupported content type" }), { status: 415 });
    }
  } catch (error) {
    console.log("Error adding to Pinata", error);
    return new Response(JSON.stringify({ error: "Error adding to Pinata" }), { status: 500 });
  }
}
