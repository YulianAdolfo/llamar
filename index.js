let callButton = document.getElementById('call-button');

let buttonFather = document.getElementById("father-button");
let buttonMother = document.getElementById("mother-button");
let buttonRemoveDevice = document.getElementById("erase-button");
let windowAskWho = document.getElementsByClassName("container-ask-who")[0];
let windowStatusConnection = document.getElementById("w-status");
let statusConnection = document.getElementById("w-connection-status");

let server_connection_list = '';
let ID_connection = '';
let audio_from_device = '';
let type_of_device = '';
let id_device_one = '682a9ed08960c979a59c8b00';
let id_device_second = '682a9efd8a456b7966a0cbaf';
let peer = "";
let AUDIO_STREAM = "";
let ID_TO_CALL = "";
type_of_device = '' // device second is family, device one means father

const SEARCHING_SERVERS = 'Buscando servidores...';
const ERROR_GETTING_STUN_SERVERS = 'Hubo un error al obtener lista de sevidores';
const PUT = "PUT";
const GET = "GET";
const UPDATED = "Identificador actualizado";
const WRONG = "Algo salió mal";
const API_KEY = '$2a$10$Q7DJHOg94P.05Ys5efXsgOYcGR42EHFiJeDWxjCpgDYww2les.i0u';


// ************* it Checks if the type of device was already set up ******************
if (localStorage.getItem("type-of-device") == undefined || localStorage.getItem("type-of-device") == "" || localStorage.getItem("type-of-device") != "device_second" && localStorage.getItem("type-of-device") != "device_one") {
    windowAskWho.style.display = "block";
}else {
    windowAskWho.style.display = "none";
    type_of_device = localStorage.getItem("type-of-device");
    windowStatusConnection.style.display = "block";
    startConnectionPeer();
}

function IamFather() {
    localStorage.setItem("type-of-device", "device_one");
    type_of_device = localStorage.getItem("type-of-device");
    windowAskWho.style.display = "none";
    windowStatusConnection.style.display = "block";
    startConnectionPeer();
}
function IamMother() {
    localStorage.setItem("type-of-device", "device_second");
    type_of_device = localStorage.getItem("type-of-device");
    windowAskWho.style.display = "none";
    windowStatusConnection.style.display = "block";
    startConnectionPeer();
}
function removeDevice() {
    localStorage.removeItem("type-of-device");
    location.reload();
}


buttonFather.onclick = () => IamFather();
buttonMother.onclick = () => IamMother();
buttonRemoveDevice.onclick = () => removeDevice();

// ************* ////////////////////////////////////////////// ******************

async function getConnectionID() {
    console.log('connecting...');
    statusConnection.innerText = "Conectando...";
    console.log("connection " + server_connection_list)
    console.log("connection " + typeof server_connection_list)
    peer = await new Peer({ config: { 'iceServers': server_connection_list } });
    await peer.on('open', function (id) {
        ID_connection = id;
        console.log('ID connectado: ' + ID_connection);
        statusConnection.innerText = "Dispositivo conectado";
        if (type_of_device == 'device_one') {

            localStorage.setItem('device_one', ID_connection);
            DataID(ID_connection, id_device_one, PUT);

        } else {

            localStorage.setItem('device_second', ID_connection);
            DataID(localStorage.getItem('device_second'), id_device_second, PUT);

        }

        peer.on('connection', function(connection) {
            console.log("Alguien quiere conectarse");
            connection.on('open', ()=> {
                connection.on('data', (data)=> {
                    console.log('recibido ', data)
                })
                connection.send('Contestado')
            })
            connection.on('close' , ()=> {
                location.reload();
            })
        });

        peer.on('call', (call) => {
            console.log("Recibiendo llamada");
            call.answer(AUDIO_STREAM);       
            call.on('stream', (remoteStream) => {
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.play();
                onCall();
            });
        });

        peer.on('close', ()=>{
            console.log("SE FUE 2");
            closeConnection();
            location.reload();
        });

    });
}

async function servers() {
    try {
        const data = await fetch('https://servers-gamma.vercel.app/');
        return await data.json();
    } catch (err) {
        return alert(ERROR_GETTING_STUN_SERVERS, err);
    }
}

async function startConnectionPeer() {
    console.log(SEARCHING_SERVERS);
    statusConnection.innerText = SEARCHING_SERVERS;
    server_connection_list = await servers();
    console.log('encontrados: ' + server_connection_list);
    statusConnection.innerText = "Servidores encontrados";
    getConnectionID();
}
async function DataID(id, device, method) {
    let data = {id: id};
    const response = await fetch('https://api.jsonbin.io/v3/b/'+device, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if(result.metadata.parentId) {
        console.log(UPDATED)
        statusConnection.innerText = UPDATED;
        windowStatusConnection.style.display = "none";
    }else {
        console.log(WRONG)
    }
}

async function GetDataID(id) {
    const response = await fetch('https://api.jsonbin.io/v3/b/'+id, {
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
        },
    });
    const result = await response.json();
    ID_TO_CALL = result;
}
// To call
callButton.onclick = async () => {
    console.log("Obteniendo ID");
    if(type_of_device == "device_one") {
        await GetDataID(id_device_second);
        console.log(ID_TO_CALL.record.id);
    }else {
        await GetDataID(id_device_one);
        console.log(ID_TO_CALL.record.id);
    }
    let connection = peer.connect(ID_TO_CALL.record.id);
    connection.on('open', ()=> {
        connection.on('data', (data)=> {
            console.log('recibido ', data)
        })
        connection.send('Contestado')
    })

    const call = peer.call(ID_TO_CALL.record.id, AUDIO_STREAM);

    call.on('stream', (remoteStream) => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play();
        onCall();
    });
    call.on('close', ()=> {
        console.log("El otro dispositivo se ha desconectado");
        closeConnection();
        location.reload();
    });
    call.on('error', (err) => {
        console.error("Error en la llamada:", err);
    });
}
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    AUDIO_STREAM = stream;
}).catch( () => {
    console.error(WRONG, error);
}); 

function onCall() {
    let button = document.getElementById("call-button");
    let icon = document.getElementById("icon");
    let statusMessage = document.getElementById("status-message");
    statusMessage.innerText = "En llamada..."
    icon.classList.remove("fa-solid", "fa-phone");
    icon.classList.add("fa-solid", "fa-microphone");
    button.style.backgroundColor = "rgb(34, 0, 255)";

    let hungUp = document.createElement("button");
    hungUp.innerHTML =  '<i class="fa-solid fa-phone-slash"></i> Colgar ';
    hungUp.classList.add("hung-up")
    hungUp.addEventListener("click", ()=> {
        closeConnection();
        location.reload();
    });
    document.body.appendChild(hungUp) 
}
function onCallFinish() {
    let button = document.getElementById("call-button");
    let icon = document.getElementById("icon");
    let statusMessage = document.getElementById("status-message");
    statusMessage.innerText = "Llamar"
    icon.classList.remove("fa-solid", "fa-microphone");
    icon.classList.add("fa-solid", "fa-phone");
    button.style.backgroundColor = "red";
    document.body.removeChild(document.body.children[5])
}
function closeConnection() {
    peer.destroy();
    onCallFinish(); 
}