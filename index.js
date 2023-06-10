const discord = require("discord.js");
const config = require("./config.json");
const {Client, GatewayIntentBits} = require("discord.js");
const ytdl = require('ytdl-core');

const client = new discord.Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

const prefix = "/";
const commandList = "Syllabus\nWelcome\nRoll";
const queue = new Map();
console.log("starting");

client.on("messageCreate", function(message)
{
    console.log(message.content);
    if (message.author.bot)
    {
        console.log("Bot message");
        return;
    }
    if (!message.content.startsWith(prefix))
    {
        console.log("not a command");
        return;
    }

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    const serverQueue = queue.get(message.guild.id);

    if (command == "welcome")
    {
        console.log("ping command");
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`This message had a latency of ${timeTaken}ms`);
    }
    if (command == "roll")
    {
        console.log("roll command");
        error = 0;

        if (!args[0])
        {
            message.channel.send("Error: no parameters.");
            return;
        }

        arg = args[0].toLowerCase();
        if (!arg.includes('d'))
        {
            message.channel.send("Error: The must be a 'd' or 'D' keychar in between the numbers.");
            return;
        }
        const subArgs = arg.split('d');
        console.log(subArgs[0]);
        //console.log(args[0][1]);
        console.log(subArgs[2]);

        number = parseInt(subArgs[0]);
        //keyword = args[0][1];
        dice = parseInt(subArgs[1]);

        if (isNaN(number))
        {
            message.channel.send("Error: First number must be a whole number.");
            error++;
            //return;
        }
        /*if (keyword === 'd' || keyword === 'D')
        {
            //message.channel.send("Debug: Success!");
        }
        else
        {
            message.channel.send("Error: Keyword must be 'd' or 'D.");
            error++;
            //return;
        }*/
        if (isNaN(dice) || dice <= 1)
        {
            message.channel.send("Error: Second number must be a whole number greater than 1.");
            error++;
            //return;
        }

        if (error > 0)
        {
            //message.channel.send("Error: An error has occured (HINT: did you add the 'd' or 'D' keyword in between the numbers?).");
            return;
        }

        //message.channel.send("Debug: You passed!");

        min = 1;
        max = dice;
        total = 0;
        outMessage = "";

        for (bogus = 0; bogus < number; bogus++)
        {
            output = getRandomInt(min, max);
            outMessage += `${output}`;
            total += output;
            if (bogus === number - 1)
            {
                outMessage += ")";
            }
            else
            {
                outMessage += ", ";
            }
        }

        if (args[1])
        {
            mod = parseInt(args[1]);
            
            if (isNaN(mod))
            {
                message.channel.send("Error: Invalid modifier (HINT: no spaces in between the sign and the number).");
                return;
            }
            total += mod;
        }

        fullMessage = `You rolled: ${total} ( ${outMessage}`;

        if (fullMessage.length > 2000)
        {
            message.channel.send("Error: more than 2000 characters.");
            return;
        }

        message.channel.send(fullMessage);
    }

    if (command == "syllabus")
    {
        if (args[0])
        {
            message.channel.send(commandHelp(args[0]));
        }
        else
        {
            message.channel.send(`Press '/' followed by a command to run it.\nType /syllabus [commandName] for help with a specific command\nCommands:\n${commandList}`);
        }
        
    }
    if (command == "play")
    {
        message.channel.send(musicPlayer(message, args, serverQueue));
    }
    if (command == "skip")
    {
        message.channel.send(skip(message, serverQueue));
    }
    if (command == "stop")
    {
        message.channel.send(stop(message, serverQueue));
    }
});
client.login(config.TOKEN);

function getRandomInt(min, max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function commandHelp(arg)
{
    if (arg === "syllabus")
    {
        return("Have you read the syllabus?");
    }
    if (arg === "welcome")
    {
        return("Checks your latency\nFormat: /welcome");
    }
    if (arg === "roll")
    {
        return("Roll the dice\nFormat: /roll [number of die]d[number of sides] (+/-[modifier])");
    }
}

async function musicPlayer(message, args, serverQueue)
{
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
    {
        return ("Error: You need to be in a voice channel to play something.");
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has("CONNECT") || !permissions.has("SPEAK"))
    {
        return ("Error: I am not allowed to speak in the voice channel.");
    }

    const songInfo = await ytdl.getInfo(args[1]);

    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue)
    {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);
        queueContruct.songs.push(song);
        
        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
          }
          catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
          }
    }
    else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue.`);
      }
}

function skip (message, serverQueue)
{
    if (!message.member.voice.channel)
    {
        return ("Error: You need to be in a voice channel to skip something.");
    }

    if (!serverQueue)
    {
        return ("Error: There is no song to skip.");
    }

    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue)
{
    if (!message.member.voice.channel)
    {
        return ("Error: You need to be in a voice channel to stop something.");
    }
    if (!serverQueue)
    {
        return ("Error: There is no song to stop.");
    }

    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function play(guild, song)
{
    const serverQueue = queue.get(guild.id);

    if (!song)
    {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}