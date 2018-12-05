const Joi = require('joi');
const backup = require('mongodb-backup');
const fs = require("fs");
const util = require("util");  
const { exec } = require('child_process');
require("dotenv").load(); 

const simpleGit = require('simple-git/promise')(`./tmp/${process.env.GIT_REPO_NAME}`);
const path = require('path');

simpleGit.addConfig('user.name', "nsdevaraj");
simpleGit.addConfig('user.email', "nsdevaraj@gmail.com");

const readFile = util.promisify(fs.readFile);

function createBackup(config) {
    return new Promise((resolve, reject) => {
        const { host, port, name, user, password, collections } = config.db;
        const uri = `mongodb://${user}:${password}@${host}:${port}/${name}`
        backup({
            uri,
            root: path.join(__dirname,"tmp", process.env.GIT_REPO_NAME),
            collections, // save this collection only
            callback: function (err) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            }
        });
    });
};

async function initiateBackup() {

    try {
        let pullResult = await simpleGit.pull("origin", "master");

        await createBackup({
            db: {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                name: process.env.DB_NAME,
                user: process.env.DB_USER,
                password: process.env.DB_PASS,
                collections: ['components', 'componentSchema', 'menuData', 'propertybank']
            }
        });

        let addResult = await simpleGit.add(".");

        var datetime = new Date();
        datetime = datetime.toISOString().slice(0, 10);
        let commitResult = await simpleGit.commit(datetime);

        let pushResult = await simpleGit.push("origin", "master");
        console.log('push');
    } catch (error) {
        console.log(error);
    }
};


exports.handler = async (event) => { 
	await initiateBackup();
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Backup done'),
    };
    return response;
};
exports.handler();
