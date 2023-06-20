const discord = require("discord.js");
const config = require("./config.json");
const file = require('fs');
const {Client, GatewayIntentBits} = require("discord.js");
const {joinVoiceChannel} = require('@discordjs/voice');
const {VoiceConnectionStatus, AudioPlayerStatus} = require('@discordjs/voice');
const {createAudioPlayer, createAudioResource} = require('@discordjs/voice');
const play = require('play-dl');

const client = new discord.Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates]});

const prefix = "!";
const commandList = "Syllabus\nWelcome\nRoll\nPlay\nPause\nStop\nSkip";
const player = createAudioPlayer();
var connection;
var subscription;
var queue = [];
console.log("starting");
var songChanged = false;

client.on("messageCreate", async function(message)
{
    if (config.USER && message.author.id != config.USER)
    {
        return;
    }
    //console.log(message.content);
    client.user.setActivity("!syllabus");
    
    if (message.author.bot)
    {
        //console.log("Bot message");
        return;
    }
    if (!message.content.startsWith(prefix))
    {
        //console.log("not a command");
        return;
    }

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command == "welcome")
    {
        //console.log("ping command");
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`This message had a latency of ${timeTaken}ms`);
    }
    if (command == "roll")
    {
        //console.log("roll command");
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
        //console.log(subArgs[0]);
        //console.log(args[0][1]);
        //console.log(subArgs[2]);

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
            message.channel.send(`Press '!' followed by a command to run it.\nType !syllabus [commandName] for help with a specific command\nCommands:\n${commandList}`);
        }
        
    }

    if (command == "play")
    {
        if (!message.member.voice.channelId)
        {
            message.channel.send("Error: you must be in a voice channel to manage songs");
            return;
        }
        if (player.state.status === AudioPlayerStatus.Paused)
        {
            player.unpause();
            message.channel.send("Unpausing");
            return;
        }

        var song = args;

        if (!song[0])
        {
            message.channel.send("Error: no song requested");
            return;
        }

        connection = joinVoiceChannel(
        {
            channelId: message.member.voice.channel.id,
            guildId: message.member.voice.channel.guild.id,
            adapterCreator: message.member.voice.channel.guild.voiceAdapterCreator,
        });
        //console.log("join command");
        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) =>
    {
        //console.log("ready state");
    });

    /*if (song)
    {
        let stream = await play.stream(song);
        let source = createAudioResource(stream.stream,
            {
                inputType: stream.type
            });

        player.play(source);
    }*/
    if (song)
    {
        let oneStringSong = "";

        for (var bogus = 0; bogus < song.length; bogus++)
        {
            oneStringSong += song[bogus] + " ";
        }

        //console.log(oneStringSong);
        let info = await play.search(oneStringSong, {limit: 1});
        let stream = await play.stream(info[0].url);
        let source = createAudioResource(stream.stream,
            {
                metadata:
                {
                    url: info[0].url,
                },
                inputType: stream.type,
                inlineVolume: true
            });

        source.volume.setVolume(0.05);
        queue.push(source);
        if (player.state.status === AudioPlayerStatus.Idle)
        {
            player.play(queue.shift());
            message.channel.send(`Playing ${info[0].url}`);
            connection.subscribe(player);
        }
        else
        {
            message.channel.send(`${info[0].url} queued`);
        }

        //console.log(queue);

        //console.log(queue);
        //player.play(source);
    }
        //playAudio(connection, player, song, message);
    }
    if (command == "pause")
    {
        if (!message.member.voice.channelId)
        {
            message.channel.send("Error: you must be in a voice channel to manage songs");
            return;
        }
        if (player.state.status === AudioPlayerStatus.Paused)
        {
            message.channel.send("Error: Song already paused");
            return;
        }
        if (player.state.status === AudioPlayerStatus.Idle)
        {
            message.channel.send("Error: no song playing");
            return;
        }
        //console.log("pause command");
        player.pause();
        message.channel.send("Pausing");
        //setTimeout(() => player.unpause(), 5_000);
    }
    if (command == "stop")
    {
        if (!message.member.voice.channelId)
        {
            message.channel.send("Error: you must be in a voice channel to manage songs");
            return;
        }
        if (player.state.status === AudioPlayerStatus.Idle)
        {
            message.channel.send("Error: no song playing");
            return;
        }
        
        queue = [];
        //console.log("stop command");
        player.stop();
        message.channel.send("Stopping");
        //console.log(queue);
    }
    if (command == "skip")
    {
        if (!message.member.voice.channelId)
        {
            message.channel.send("Error: you must be in a voice channel to manage songs");
            return;
        }
        var nextSong = queue.shift();
        //player.stop();

        if (!nextSong)
        {
            message.channel.send("End of queue reached");
            player.stop();
            //connection.destroy();
            //console.log(queue);
            return;
        }

        message.channel.send("Song skipped");

        //console.log(queue);
        message.channel.send(`Now playing ${nextSong.metadata.url}`);
        player.play(nextSong);
        connection.subscribe(player);
    }

    player.on(AudioPlayerStatus.Idle, () =>
    {
        if (songChanged)
        {
            console.log("not yet");
            return;
        }
        console.log("playing next song");
        var nextSong = queue.shift();
        //player.stop();

        if (!nextSong)
        {
            //message.channel.send("End of queue reached");
            return;
        }

        message.channel.send(`Now playing ${nextSong.metadata.url}`);
        player.play(nextSong);
        connection.subscribe(player);
        songChanged = true;
    });

    player.on(AudioPlayerStatus.Playing, () =>
    {
        if (!songChanged)
        {
            return;
        }
        songChanged = false;
        console.log("stalled successfully");
    })

    player.on('error', error =>
    {
        message.channel.send(`Error with ${nextSong.metadata.url} playback`);

        var nextSong = queue.shift();
        //player.stop();

        if (!nextSong)
        {
            message.channel.send("End of queue reached");
            return;
        }

        message.channel.send(`Now playing ${nextSong.metadata.url}`);
        player.play(nextSong);
        connection.subscribe(player);
    })
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
        return("Checks your latency\nFormat: !welcome");
    }
    if (arg === "roll")
    {
        return("Roll the dice\nFormat: !roll [number of die]d[number of sides] (+/-[modifier])");
    }

    if (arg === "play")
    {
        return("Play a song from youtube or add it to the queue (must be in a voice channel)\nFormat: !play [song name or url]\nOR\nUnpause a song (must be in a voice channel)\nFormat: !play");
    }
    if (arg === "pause")
    {
        return("Pause the song (must be in a voice channel)\nFormat: !pause");
    }
    if (arg === "stop")
    {
        return("Stop the song and wipe the queue (must be in a voice channel)\nFormat: !stop");
    }
    if (arg === "skip")
    {
        return("Skips the song (must be in a voice channel)\nFormat: !skip");
    }
}