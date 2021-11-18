//Aqui establecemos el servidor web con express por si lo hostearas via uptime en replit
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('?')
});
//Hacemos que escuche el puerto 3000
app.listen(3000, () => {
});

//Empezamos el code
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json'); //cambia el nombre de config.example.json a config.json
const db = require('quick.db')
const prefix = "as!"
const ytch = require('yt-channel-info');
const SykoCoder = require("youtube-channel-statistics");
const  twitch = require('twitchrequest');
const twclient = new twitch.Client({
    channels: db.get('twcanales'),

    client_id: config.twid,

    client_secret: config.twsecret,

    interval: 3
});
	const ytnotifier = require('./notif.js');
let Notifier = new ytnotifier({
    channels: db.get('ytcanales'),
    checkInterval: 30
});
client.on('ready', async()=>{
  

  const chyt = db.get('ytcanales')
  const chtw = db.get('twcanales')
  if(!chyt || !chyt.length){
    db.set('ytcanales', [])
  }
   if(!chtw || !chtw.length){
    db.set('twcanales', [])
  }
let usuarios = client.users.cache.size

const estados = ["Twitch Streams", "Youtube Videos", usuarios+' usuarios']
console.log(`Bot logeado como ${client.user.tag} y la ID ${client.user.id}`);
setInterval(function(){ 
client.user.setPresence({
  status: "idle",
  browser: "DISCORD IOS",
  activity: {
    name: estados[Math.floor(Math.random() * estados.length)],
    type: "WATCHING"
  }
});

  }, 5000)

});

client.on('message', async(message) =>{
  if(!message.guild || message.author.bot) return;
if(message.channel.id != config.canalcomandos) return;

  let args = message.content.slice(prefix.length).trim().split(/ +/g);
    let cmd = args.shift().toLowerCase();
    if(!cmd) return;
    if(cmd ===  "addytch" || cmd === "añadiryt" || cmd === "addytchannel"){
const chs = db.get('ytcanales')
if(!args.join(" ")) return message.channel.send('> :x: | Debes ingresar la ID de un canal de Youtube');
client.message = message;
if(chs.includes(args.join(" "))) return message.channel.send('> :x: | Canal de Youtube ya agregado');

const ch = await SykoCoder.getYoutubeChannelInfo(args.join(" "));
if(ch){
  const ch2 = await ytch.getChannelInfo(args.join(" "));
 db.push('ytcanales', args.join(" "))

  message.channel.send('> Canal **'+ch2.author+'** añadido correctamente\n> '+ch2.authorUrl);

}

    }
    if(cmd ===  "addtwch" || cmd === "añadirtw" || cmd === "addtwchannel"){
const chs = db.get('twcanales')
if(!args.join(" ")) return message.channel.send('> :x: | Debes ingresar el nombre de tu canal Twitch');

if(chs.includes(args.join(" "))) return message.channel.send('> :x: | Canal de Twitch ya agregado');


const userData = await twclient.getUser(args.join(" "));

if(!userData) return message.channel.send('> :x: | Canal invalido');
 db.push('twcanales', args.join(" "))
 twclient.addChannel(args.join(' '));
  message.channel.send('> Canal **'+args.join(" ")+'** añadido correctamente!');



    }
});



client.login(config.tokendiscord)

process.on("uncaughtException", (err, origin) => {
  
    if(err.message === "Cannot read property '0' of undefined"){
      client.message.channel.send('> :x: | Canal invalido')
    }
});





twclient.on('live', (data) => {
    client.channels.resolve(config.canalnotistw).send(`**${data.name}** esta en vivo!\n> Streameando **${data.title}** en **${data.game ? data.game : 'no definido'} **!\n> Empezado: **${data.date}**\n> https://twitch.tv/`+data.name);
});


Notifier.on('video', video => {
   const discord = client.channels.resolve(config.canalnotisyt);
discord.send(':eyes: | El canal **'+video.channelName+'** ha publicado el video **'+video.title+'**\n> https://twitch.tv/'+video.channelName)
   
});
