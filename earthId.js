import axios from 'axios';
import crypto from 'crypto';
// optional only required if you want to listen as socket along with webhook
// import io from 'socket.io-client';
// const SOCKET_URL = "https://socket.myearthid.ml";

const GENERATE_QR_API = 'https://server.myearthid.ml/authorize/generateQrCode';

// please place your APIKey received from earthID here
const API_KEY = "";
// please place your secretKey received from earthID here
const SECRET_KEY = "";

var socket;
var socketId = null;

//function to generate QR code either for login or document
export async function generateQrCode(type = 'login') {
    // optional only required if you want to listen as socket along with webhook
    // socketId = await openSocketConnection();
    return new Promise(async (resolve, reject) => {
        try {
            if (!API_KEY) {
                return new Error("API_KEY is empty!")
            }
            axios.get(`${GENERATE_QR_API}?socketId=${socketId}`, {
                headers: await getHeaders()
            }).then(response => {
                if (response.data.code === 200) {
                    return resolve(response.data.result);
                } else {
                    let errorString = response.data.message ? response.data.message : "Something went wrong"
                    return reject(errorString);
                }
            }).catch(e => {
                return reject(e)
            })
        } catch (e) {
            return reject(e)
        }
    })
}

//function to verify webhook request is from EarthId and its valid
export async function verifyGatewaySignature(req) {
    try {
        const hmacReceived = req.headers["x-request-signature-sha-256"];
        const reqBody = req.body;
        if (hmacReceived && reqBody) {
            var hmacCreated = crypto.createHmac('sha256', 'YOUR_SECRET_KEY').update(JSON.stringify()).digest('hex');
            if (hmacReceived === hmacCreated) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (e) {
        return Error(e);
    }
}

// Helper function to attach required headres and signature
async function getHeaders() {
    const timestamp = Date.now().toString();
    const nonce = await generateRandomNonce();
    var payloadBody = API_KEY + nonce + timestamp;
    var signature = crypto.createHmac('sha256', 'YOUR_SECRET_KEY').update(JSON.stringify(payloadBody)).digest('hex');
    return {
        'x-request-signature-sha-256': signature,
        'api-key': API_KEY,
        'timestamp': timestamp,
        'nonce': nonce,
    };
}

// Helper function to generate random nonce
async function generateRandomNonce() {
    try {
        return (Math.floor(100000 + Math.random() * 900000)).toString();
    } catch (error) {
        throw new Error(error);
    }
}

async function openSocketConnection() {
    return new Promise(async (resolve, reject) => {
        socket = await io.connect(SOCKET_URL);
        socket.on('connect', () => {
            //lisetn for user data
            socket.on(`userdata`, async data => {
                if(data.newreq && data.newreq.permission == 'granted') {
                    let userData = data.newreq;
                } else { //denied
                    //show alert or similar to notify user has denied the request.
                }
                disconnectSocket();
            });
            resolve(socket.id);
        })
    })
}

async function disconnectSocket() {
    if (socket) {
        socket.disconnect();
    }
}
