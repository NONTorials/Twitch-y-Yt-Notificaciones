//Este es un fork mio de otro npm, lo tuve que incorporar debido a que no me permitia instalarlo y asi es mas facil todo el trabajo

//FAVOR DE NO MOVER ESTA AREA
const { join } = require('path'),
	EventEmitter = require('events'),
	rss = require('rss-parser'),
	parser = new rss();

const YTNotisError = require('./error');
if (typeof (localStorage) == 'undefined' || typeof (localStorage) == 'null') {
	var LocalStorage = require('node-localstorage').LocalStorage;
	localStorage = new LocalStorage(join(__dirname, 'storage'));
}

class Notifier extends EventEmitter {
	constructor(options = {
		channels: [],
		checkInterval: 50
	}) {
		super();
		if (!options.checkInterval) options.checkInterval = 50;

		if (!Array.isArray(options.channels)) throw new YTNotisError('Los canales deben ser un Array');

		this.ids = options.channels;
		this.add = (channels) => {
			channels.forEach(id => {
				parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`)
					.then(response => {
						let videoid = response.items[0].id.replace('yt:video:', '');
						localStorage.setItem(videoid, videoid);
					}).catch(err => {
						if (err.message == 'Status code 404') throw new YTNotisError(`Canal no encontrado. ID del Canal : ${id}`);
						console.warn(err);
					});
			});
		}
		this.add(options.channels);
		if (typeof (options.checkInterval) != 'number') {
			throw new YTNotisError('El intervalo de revision debe ser un numero!');
		} else if (options.checkInterval < 30) {
			throw new YTNotisError('El intervalo es muy corto, podria generar problemas');
		};

		setInterval(() => {
			this.ids.forEach(id => {
				parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`)
					.then(response => {
						let item = response.items[0];
						const video = {}
						video.channelName = item.author;
						video.title = item.title;
						video.publishDate = `${item.pubDate.split('T')[0]} ${item.pubDate.split('T')[1].replace('.000Z', '')}`;
						video.url = item.link;
						video.id = item.id.replace('yt:video:', '');
						if (localStorage.getItem(video.id)) return;
						localStorage.setItem(video.id, video.id);
						this.emit('video', video);
					})
					.catch(err => {
						if (err.message == 'Status code 404') throw new YTNotisError(`Canal no encontrado. ID del canal: ${id}`);
						console.warn(err);
					});

			});
		}, options.checkInterval * 1000);
	}
	addChannels(channels) {
		return new Promise((resolve, reject) => {
			if (!Array.isArray(channels)) return reject('Los canales deben ser un Array');
			if (channels.length == 0) return reject('Debes declarar IDs de canales');
			var result = [],
				i = 0,
				check = (data) => {
					result.push(data);
					i++;
					if (channels.length == i) resolve(result);
				};
			channels.forEach(channel => {
				parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`).then(response => {
					this.ids.push(channel);
					let videoid = response.items[0].id.replace('yt:video:', '');
					localStorage.setItem(videoid, videoid);
					check({ result: true, channelID: channel });
				}).catch(err => {
					if (err.message == 'Status code 404') {
						check({ result: 'Canal no encontrado.', channelID: channel });;
					} else {
						check({ result: err, channelID: channel });
					}
				})
			});
		});
	}

	removeChannels(channels) {
		return new Promise((resolve, reject) => {
			if (!Array.isArray(channels)) return reject('Los canales deben ser un Array');
			if (channels.length == 0) return reject('Debes declarar las IDs de los canales');
			var result = [],
				i = 0,
				check = (data) => {
					result.push(data);
					i++;
					if (channels.length == i) resolve(result);
				};

			channels.forEach(channel => {
				if (!this.ids.some(url => url == channel)) {
					check({ result: 'Canal desconocido', channelID: channel });
				}
				for (let i = 0; i < this.ids.length; i++) {
					if (!this.ids[i] == channel) return;
					this.ids.splice(i, 1);
					check({ result: true, channelID: channel });
				}
			})
		})
	}
}

module.exports = Notifier;
