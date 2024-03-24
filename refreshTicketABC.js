const fs = require('fs');
const refreshTicketList = require('./refreshTicketList')
const refreshTicketDetail = require('./refreshTicketDetail')
const refreshTicketTag = require('./refreshTicketTag')
const generateDataSnapshot = require('./generateSnapshot')

async function startRefresh(){
    if(process.env.PLATFORM === 'FAAS') {

    } else {
        await refreshTicketList()
        await refreshTicketDetail()
        await refreshTicketTag()
        await generateDataSnapshot()
    }

    setInterval(refreshTicketList, 1000 * 60 * 10)      // List    - every 10 minutes
    setInterval(refreshTicketDetail, 1000 * 60 * 15)    // Detail  - every 15 minutes
    setInterval(refreshTicketTag, 1000 * 60 * 5)        // Tag     - every 05 minutes
    setInterval(generateDataSnapshot, 1000 * 60 * 10)   // Snapshot - every 10 minutes
}

module.exports = startRefresh