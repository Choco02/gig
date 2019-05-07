exports.run = async (client, message, args) => {
    try {
        message.channel.send("-> "+args.join(" "));
    } catch(e) {
        message.channel.send(e);
    }

}

exports.config = {
    name: 'play',
    aliases: ['play']
}