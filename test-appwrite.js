import { Client, Databases, Query } from 'node-appwrite';
const client = new Client().setEndpoint('https://cloud.appwrite.io/v1').setProject('69d8eda100264f4e42ae');
const databases = new Databases(client);

async function test() {
    try {
        const res = await databases.listDocuments('69d8f0b0003c6d1e4d93', 'EventsTable', [Query.limit(1)]);
        console.log("Success reading!", res.total);
    } catch(e) {
        console.error(e);
    }
}
test();
