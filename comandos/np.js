const Discord = require('discord.js');
const moment = require('moment');
exports.run = async (client, message, args, opts) => {

    let musica = opts.map.get(message.guild.id);
    if(!musica)
        return message.reply("não há nenhuma música!");
    
    let embed = new Discord.RichEmbed().setTitle('<a:Labfm:482171966833426432> Tocando agora:').
    setDescription('['+musica.queue[0].nome+']('+musica.queue[0].url+')').addField("Canal:",musica.queue[0].canal)
    .addField("Publicado em:", moment(musica.queue[0].pub).format("DD/MM/YYYY"))
    .setFooter("Adicionada por: "+musica.queue[0].qr.tag,musica.queue[0].qr.avatarURL)
    .setColor('RANDOM');
    message.reply(embed)
   
}

exports.config = {
    name: 'nowplaying',
    aliases: ['np','tocando agora','ta']
}