exports.run = async (client, message, args, opts) => {
    
    //Aqui nós pegamos objeto relacionado ao id da guild
    let obter = opts.map.get(message.guild.id);

    //Condição para caso não haja nada no objeto. Se não tem nada significa que não tem música, né?
    if(!obter)
        return message.reply(" não há músicas na fila para pausar");
    //o retorno do if já diz o que ele faz. Caso o usuário não esteja no mesmo canal que o bot, ele não poderá pausar
    if(!message.member.voiceChannel || message.member.voiceChannel !==message.guild.me.voiceChannel)
        return message.reply(" você não está conectado a um canal de voz ou no mesmo que estou");
    //Se a música já estiver pausada , será enviado um alerta 
    if(obter.dispatcher.paused)
        return message.reply(" música já pausada");
    
    //E por fim, caso não aconteça nada das verificações anteriores, pausamos a música
    obter.dispatcher.pause();

    message.reply(` a música ${obter.queue[0].nome} foi pausada!`);
    
}

exports.config = {
    name: 'pause',
    aliases: ['pause']
}