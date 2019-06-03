exports.run = async (client, message, args, opts) => {
    
        let fetched = opts.map.get(message.guild.id);
        //se não houver nada
        if(!fetched)
            return message.reply(" não há nenhuma música");
        //vefificação caso o usuário esteja em outro canal. Afinal o que ele tem haver com a party?
        if(message.member.voiceChannel !==message.guild.me.voiceChannel)
            return message.reply(" você não está conectado no mesmo que estou");
        //conamos a quantidades de usuários na sala
        let count = message.member.voiceChannel.members.size-1;
        let requerido;
        
        //Observe que é divido count/2
        //Aqui usamos um operador ternário. Caso o numeros de users seja par, será adicionado mais 1
        //ao valor da qtd de votos requeridos para pular. Meu bot é democrático
        count%2==0? requerido = Math.ceil(count/2)+1 : requerido = Math.ceil(count/2);
        //https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Operators/Operador_Condicional
        //https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil

        if(!fetched.queue[0].votes)
            fetched.queue[0].votes = [];
        if(fetched.queue[0].votes.includes(message.member.id))
            return message.reply(" você já votou, espertinho 😏");
        
        fetched.queue[0].votes.push(message.member.id);
        
        let msg = await message.channel.send('Votos para pular: '+fetched.queue[0].votes.length+'/'+requerido)
        msg.delete(5000)
        opts.map.set(message.guild.id,fetched);
        if (fetched.queue[0].votes.length>=requerido) {
            message.channel.send("Pulei!");
            return fetched.dispatcher.end();
        }
        //message.channel.send("É pra pular? Votos: "+fetched.queue[0].votes.length+"/"+requerido);
        console.log('musica pulada');
    
    

}

exports.config = {
    name: 'skip',
    aliases: ['skip','pular']
}