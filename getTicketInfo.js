const fs = require('fs');

const CACHE_DIR = (process.env.PLATFORM == 'FAAS')?'../order_platform/':'./order_platform/'

async function getDataSnapshot() {
    try {
        const disk_data = await ((f)=>{
            return new Promise((resolve) => {
                resolve(JSON.parse(fs.readFileSync(f, {encoding:'utf8', flag:'r'})))
            }).catch(err=>{
                console.log('JSON Parse error ' + err)
            })
        })(`${CACHE_DIR}snapshot.json`)
        console.log(disk_data.orderDataList.length)

        return disk_data.orderDataList

    } catch(err) {
        console.log(err);
    }
 
    return null;
}

module.exports = getDataSnapshot