const apikey = require('../apikey.json');
const YouTube = require('simple-youtube-api');
const yt = new YouTube(apikey.yt);
const ytdl = require('ytdl-core');

exports.run = async (client, message, args, opts) => {
    try {
        //verifica se o membro está conectado, se não, mandará a seguinte mensagem (após o if)
        if (!message.member.voiceChannel)
            return await message.channel.send("<@"+message.author.id+">, entre em um canal de voz antes para que eu possa soltar o som...");
        //verifica se o comando foi executado sem argumentos
        if(!args)
            return await message.channel.send("<@"+message.author.id+">, coloque um link (YouTube) ou nome da música para que eu possa toca-la!");
        //verifica se o bot já está tocando em um canal diferente 
        if(message.guild.me.voiceChannel && message.guild.me.voiceChannelID!=message.member.voiceChannelID)
            return await message.channel.send("<@"+message.author.id+">, o DJ <@"+client.user.id+"> está ocupado no momento tocando em outro canal!");
        
        else{
            try {
                //pegando informação do vídeo
                let info = await ytdl.getInfo(args[0].toString());
                //Aqui é onde é requisitado o objeto relacionado a guild que o comando foi executado, se não ele cria outro (por isso ||)
                //Isso é muito importante, pois se há uma transmissão simultânea em servidores, será compartilhada as mesmas informações
                //O que não pode acontecer de jeito nenhum, né?!
                //leia sobre Maps aqui: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Map
                let data = opts.map.get(message.guild.id) || {};
                //verifica se o bot está em conectado, se não, ele será conectado
                if(!data.connection)
                    data.connection = await message.member.voiceChannel.join();
                //basicamente a mesma coisa, se não houver uma queue para aquela deterinada chave, será criada
                if(!data.queue)
                    data.queue = [];
                //adiciona o id da guild ao objeto
                data.guildID = message.guild.id;
                //adiciona um objeto a queue, com as informações da música pedida
                //entenda melhor sobre objetos em JS: https://developer.mozilla.org/pt-BR/docs/Aprender/JavaScript/Objetos/B%C3%A1sico
                data.queue.push({
                    nome:info.title,
                    qr:message.author.tag,
                    url:args[0],
                    anuncio:message.channel.id
                });
                //se não ouver nenhum trasnmissão, será chamada a função de tocar
                if(!data.dispatcher)
                    play(client,opts,data);
                else{
                    message.channel.send("Musica adicionada a fila!");
                }
                //E essa linha? Simples, se a já houver um expedidor, será somente adicionado um novo valor a chave da guild
                //Você entenderá melhor nas próximas funções, guenta aí
                opts.map.set(message.guild.id,data);

            } catch(e) {
                message.channel.send(e.toString());
            }
            
        }
        
    } catch(e) {
        message.channel.send(e);
    }

}

async function play(client,opts,data){
    //pega o canal da instancia atual e envia ao mesmo uma mensagem
    client.channels.get(data.queue[0].anuncio)
    .send(`Estou tocando agora: ${data.queue[0].nome} Pedida por: ${data.queue[0].qr}`);
    //cria-se a transmissão. Nada melhor do que a própria documentação pra explicar:
    //https://discord.js.org/#/docs/main/stable/class/StreamDispatcher
    data.dispatcher = await data.connection.playStream(ytdl(data.queue[0].url),{filter:'audioonly'});
    //expedidor por guild
    data.dispatcher.guildID = data.guildID;
    //aqui é um evento que será wmitido assim que o dispatcher terminar
    data.dispatcher.on('end',function(){
        //e mandamos o parametro. Esse this significa que será mandado o dispatcher atual
        finish(client, opts, this);
    });
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
    }
    } catch (error) {
        console.log(error);
    }
}

exports.config = {
    name: 'play',
    aliases: ['play'],
}