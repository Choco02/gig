const apikey = require('../apikey.json');
const YouTube = require('simple-youtube-api');
const yt = new YouTube(apikey.yt);
const ytdl = require('ytdl-core-discord');
const moment = require('moment');
const Discord = require('discord.js');
const prism = require('prism-media');
const fs = require('fs');
//recomendo fortemente que leia a documentação do discord para que entenda algumas partes dos códigos
//-> https://discord.js.org/#/docs/main/stable/class/StreamDispatcher

exports.run = async (client, message, args, opts) => {
    try {
        //verifica se o membro está conectado, se não, mandará a seguinte mensagem (após o if)
        if (!message.member.voiceChannel)
            return message.reply(" entre em um canal de voz antes para que eu possa soltar o som...");
        //verifica se o comando foi executado sem argumentos
        if(!args)
            return message.reply(" coloque um link (YouTube) ou nome da música para que eu possa toca-la!");
        //verifica se o bot já está tocando em um canal diferente 
        if(message.guild.me.voiceChannel && message.guild.me.voiceChannelID!=message.member.voiceChannelID)
            return message.reply(" o DJ "+client.user+" está ocupado no momento tocando em outro canal!");
        
        else{
            try {
                
                //Aqui é onde é requisitado o objeto relacionado a guild que o comando foi executado, se não ele cria outro (por isso ||)
                //Isso é muito importante, pois se há uma transmissão simultânea em servidores, será compartilhada a mesma playlist
                //O que não pode acontecer de jeito nenhum, né?!
                //leia sobre Maps aqui: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Map
                let data = opts.map.get(message.guild.id) || {};
                //basicamente a mesma coisa, se não houver uma queue para aquela deterinada chave, será criada
                if(!data.queue)
                data.queue = [];
                //adiciona o id da guild ao objeto
                data.guildID = message.guild.id;
                //adiciona um objeto a queue, com as informações da música pedida
                //entenda melhor sobre objetos em JS: https://developer.mozilla.org/pt-BR/docs/Aprender/JavaScript/Objetos/B%C3%A1sico
                let check = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
                if(args[0].match(check)){
                    let playlist = await yt.getPlaylist(args[0]);
                    let videos = await playlist.getVideos();
                    for(let i=0;i<videos.length;i++){
                        data.queue.push({
                            nome:videos[i].title,
                            qr:message.author,
                            url:videos[i].url,
                            canal:videos[i].channel.title,
                            pub:videos[i].publishedAt,
                            anuncio:message.channel.id
                        });
                    }
                    //verifica se o bot está em conectado, se não, ele será conectado
                    if(!data.connection)
                        data.connection = await message.member.voiceChannel.join();
                    //se não ouver nenhum trasnmissão, será chamada a função de tocar
                    if(!data.dispatcher)
                        await play(client,opts,data);
                    else{
                        message.channel.send(playlist.title+" adicionada a fila!");
                    }
                }
                if(!args[0].match(check)){
                    //procurando pela música
                    let song = await yt.searchVideos(args.join(" "),5);
                    let escolhida=null;
                    let embed= new Discord.RichEmbed().setTitle('Escolha de 1 a 5')
                    .addField('Resultados da busca:',song.map(r=>(song.indexOf(r)+1)+'-'+r.title).join('\n'))
                    .setColor('RANDOM')
                    message.channel.send(embed).then(async (msg)=>{
                        let emoji = ['1⃣',"2⃣","3⃣","4⃣","5⃣"];
                        for (let i=0;i<5;i++){
                            
                            
                            await msg.react(emoji[i]);
                        }
                        const filter = (r, u) => r.me && u.id === message.author.id;
                        const collector = msg.createReactionCollector(filter, {max: 1, time: 60 * 1000 });

                        collector.on('collect', async (e)=>{
                            msg.delete();
                            
                            switch (e.emoji.name) {
                                case emoji[0]:
                                    escolhida=song[0];
                                    break;
                                case emoji[1]:
                                    escolhida=song[1];
                                    break;
                                case emoji[2]:
                                    escolhida=song[2];
                                    break;
                                case emoji[3]:
                                    escolhida=song[3];
                                    break;
                                case emoji[4]:
                                    escolhida=song[4];
                                    break;
                                default:message.channel.send('deu ruim')
                                    break;
                            }
                            
                            data.queue.push({
                                nome:escolhida.title,
                                qr:message.author,
                                url:escolhida.url,
                                canal:escolhida.channel.title,
                                pub:escolhida.publishedAt,
                                anuncio:message.channel.id
                            });
                            //verifica se o bot está em conectado, se não, ele será conectado
                            if(!data.connection)
                                data.connection = await message.member.voiceChannel.join();
                            //se não ouver nenhum trasnmissão, será chamada a função de tocar
                            if(!data.dispatcher)
                                await play(client,opts,data);
                            else{
                                message.channel.send(data.queue.slice(-1)[0].nome+" adicionada a fila!");
                            }
                        })
                    })
                    
                }
                
                //E essa linha? Simples, se a já houver um expedidor, será somente adicionado um novo valor a chave da guild
                //Você entenderá melhor nas próximas funções, guenta aí
                opts.map.set(message.guild.id,data);

            } catch(e) {
                console.log(e);
                if(e.code && e.code==403)
                message.channel.send('atualmente uso a API do YouTube de forma gratuita, e no momento atingi o limite da cota diária de requisições. Tente novamente mais tarde!');
            }
            
        }
        
    } catch(e) {
        message.channel.send(e.toString());
    }

}

async function play(client,opts,data){
    
    //cria-se a transmissão. Nada melhor do que a própria documentação pra explicar:
    //https://discord.js.org/#/docs/main/stable/class/StreamDispatcher
    /*const input = await ytdl(data.queue[0].url)
    const pcm = input.pipe(new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 }));
    data.dispatcher = data.connection.playConvertedStream(pcm);
    data.dispatcher.setBitrate(48000);*/
    
    data.dispatcher = await data.connection.playOpusStream(await ytdl(data.queue[0].url));
    data.dispatcher.on('start', () => {
        data.dispatcher.player.streamingData.pausedTime = 0;
    });
    //expedidor por guild
    data.dispatcher.guildID = data.guildID;
    //aqui é um evento que será wmitido assim que o dispatcher terminar
    data.dispatcher.on('end',function(reason){
        //e mandamos o parametro. Esse this significa que será mandado o dispatcher atual
        console.log('Musica finalizada! razão = '+reason);
        finish(client, opts, this);
        
    }).on('error', console.error);
    //pega o canal da instancia atual e envia ao mesmo uma mensagem
    if(data.dispatcher){
        let embed = new Discord.RichEmbed().addField("Música:",'['+data.queue[0].nome+']('+data.queue[0].url+')').addField("Canal:",data.queue[0].canal)
        .addField("Publicado em:", moment(data.queue[0].pub).format("DD/MM/YYYY")).setFooter("Adicionada por: "+data.queue[0].qr.tag,data.queue[0].qr.avatarURL)
        .setColor('RANDOM');
        client.channels.get(data.queue[0].anuncio).send(embed);
    }
}

function finish(client, opts, dispatcher){
    try {
        //novamente, pegamos o objeto relacionado a guild
        let fetched = opts.map.get(dispatcher.guildID);
        //tiramos a primeira posição da música, aquela que acabou de ser finalizada
        //Lembre-se do evento 'end'!
        fetched.queue.shift();

        //caso haja musicas na queue (por isso verificamos o tamanho do array), será chamada novamente a função de musica
        //e será passada os proximos valores, sem a musica anterior
        if(fetched.queue.length>0){
            opts.map.set(dispatcher.guildID,fetched);
            console.log("Musica passada =>"+fetched.queue[0].nome);
            play(client,opts,fetched);
        }else{
            //Agora nas linhas a seguir se, não houver mais nada pra tocar, o objeto com a refeência da guild será destruido.
            //e o bot será desconectado do canal de voz. Ocupar memória pra que, né?
            //Quem vive de passado é museu
            opts.map.delete(dispatcher.guildID);
            let vc = client.guilds.get(dispatcher.guildID).me.voiceChannel;
            if(vc)
                vc.leave();
            //E fim da história do comando play
            console.log("Queue finalizada");
        }
        } catch (error) {
            console.log(error);
        }
}

exports.config = {
    name: 'play',
    aliases: ['play','tocar'],
}