const discord = require("discord.js");
const config = require("./config.json");
const {Client, GatewayIntentBits} = require("discord.js");
const file = require('fs');
var date = new Date();
var month = date.getMonth() + 1;
var day = date.getDate();
var timestamp = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;

const client = new discord.Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

const prefix = "!"; //change back to slash when done testing
const commandList = "Syllabus\nWelcome\nRoll";
console.log("starting");

client.on("messageCreate", function(message)
{
    if (config.USER && message.author.id != config.USER)
    {
        return;
    }
    file.appendFile(`logs/${month}-${day}.txt`, `${timestamp}: ${message.author.username} (${message.author.id}): ${message.content}\n`, err =>
    {
        if (err)
        {
            console.error(err);
        }
    });

    client.user.setActivity("!syllabus");
    //console.log(message.content);
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
}