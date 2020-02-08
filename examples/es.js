const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://elastic:9200' });
const WritableBulk = require('elasticsearch-streams').WritableBulk;
const TransformToBulk = require('elasticsearch-streams').TransformToBulk;
const reader = require('../lib/reader')
const args = process.argv.slice(2);

if (args.length !== 1) {
    console.error(`
Error: Cantidad de parámetros inválidos

Ejemplo: 

node examples/es "/path/to/pdf"
    `);
    process.exit(1)
}

const pdfPath = args[0];
const index = "chile";
const type = "ppl";

const bulkExec = (bulkCmds, callback) => {
    client.bulk({
        index: index,
        type: type,
        body: bulkCmds
    }, callback);
}

const setup = async () => {
    let response = await client.cluster.health({});
    console.log("status: " + response.body.status)
}

const createIndex = async () => {
    try {
        let response = await client.indices.create({ index: index });
        console.log('success: ' + response.body.acknowledged)
    } catch (error) {
        console.error('error: ' + error.message)
    }
}

const run = async () => {
    await setup();
    await createIndex();
    const ws = new WritableBulk(bulkExec);
    const toBulk = new TransformToBulk(function getIndexTypeId(doc) { return { _id: doc.uid }; });
    reader(pdfPath).pipe(toBulk).pipe(ws)
        .on('finish', () => {
            console.log('Fin :)');
        }).on('error', error => {
            console.error(error.message);
        });
}

run();