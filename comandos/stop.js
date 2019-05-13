exports.run = async (client, message, args, opts) => {

    if(message.member.voiceChannel !==message.guild.me.voiceChannel)
        return message.reply(" você precisa estar no mesmo canal de voz que o meu para fazer isso");
        //deletando o objeto da guild
        opts.map.delete(message.guild.id);
        //saindo do canal de voz
        message.member.voiceChannel.leave();
    console.log('Parado!');
}

exports.config = {
    name: 'stop',
    aliases: ['stop']
}