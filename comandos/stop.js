exports.run = async (client, message, args, opts) => {

    if(message.member.voiceChannel !==message.guild.me.voiceChannel)
        return message.reply(" você precisa estar no mesmo canal de voz que o meu para fazer isso");
    
    let fetched = opts.map.get(message.guild.id);
    //zerando a queue
    fetched.queue=[];
    return fetched.dispatcher.end();
    console.log('Parado!');
}

exports.config = {
    name: 'stop',
    aliases: ['stop']
}