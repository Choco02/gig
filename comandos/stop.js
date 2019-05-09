exports.run = async (client, message, args, opts) => {

    if(message.member.voiceChannel !==message.guild.me.voiceChannel)
        return message.reply(" você precisa estar no mesmo canal de voz que o meu para fazer isso");
    //saindo do canal de voz
    message.member.voiceChannel.leave();
    //deletando o objeto da guild
    opts.map.delete(message.guild.id);
    console.log('Parado!');
}

exports.config = {
    name: 'stop',
    aliases: ['stop']
}