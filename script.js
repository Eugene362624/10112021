import axios from "axios";
import xl from 'excel4node'
import xlsx from 'xlsx'

const excelFile = xlsx.readFile('./excel.xlsx')
const sheet = excelFile.Sheets[excelFile.SheetNames[0]]

const config = {
    hosts: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    headers: [
        {Authorization: "Bearer AAassdasd"}, 
        {Authorization: "Bearer AA442321"}, 
        {Authorization: "Bearer 42763271261"}
    ],
    uris: [],
    requests: []
}

// parsing excel uris column
for(let i = 2; i > 0; i++) {
    if (!sheet['A'+i]) break
    config.uris.push(sheet["A"+i].v)
}

async function main() {
    if (config.hosts.length !== config.headers.length) {
        console.log('Error in config. Invalid hosts or headers length.')
        return
    }
    config.requests = config.hosts.map((host, e) => config.uris.map(uri => ({url: host + uri, headers: config.headers[e]})))
    config.requests = config.requests.flat(1)
    const promises = config.requests.map(el => getData(el.url, el.headers))
    Promise.all(promises)
        .then(responsesArr => {
            let responses = []
            const resByUri = config.uris.map(e => ({ params: e.split('?')[1], data: [], match: true }))

            for (let i = 0; i < responsesArr.length; i++) {
                responses.push(responsesArr[i].data.length ? JSON.stringify(responsesArr[i].data) : "Empty response")
                config.requests[i].response = responsesArr[i].data.length ? JSON.stringify(responsesArr[i].data) : "Empty response"
            }

            for (let i = 0; i < responses.length; i++) {
                resByUri[i % config.uris.length].data.push(responses[i].toString())
            }

            for (let i = 0; i < resByUri.length; i++) {
                let match = false
                resByUri[i].data.forEach((e, o) => {
                    match = (resByUri[i].data[o + 1] ? e == resByUri[i].data[o + 1] : e == resByUri[i].data[0])
                    if (!match) resByUri[i].match = false
                    if (match && !(resByUri[i].match == false)) resByUri[i].match = true
                })
            }

            writeExcel(config, resByUri)
        })
}

function getData(url, headers) {
    return axios.get(url, {
        headers: headers
    })
}

function writeExcel(config, resByUri) {
    let wb = new xl.Workbook()
    let ws = wb.addWorksheet('Response checker')

    //set columns width
    ws.column(1).setWidth(30)
    ws.column(2).setWidth(20)
    // ws.column(3).setWidth(50)

    //set names to the columns
    ws.cell(1, 1).string('Uri params')
    ws.cell(1, 2).string('Is match')
    ws.cell(1, 3).string('Responses')

    //filling uri column
    for (let i = 2; i < config.uris.length + 2; i++) {
        ws.cell(i, 1).string(config.uris[i - 2])
    }

    //filling isMatch column
    for (let i = 2; i < resByUri.length + 2; i++) {
        ws.cell(i, 2).string(resByUri[i - 2].match.toString().toUpperCase())
    }

    //filling responses column
    for (let i = 2; i < resByUri.length + 2; i++) {
        for (let e = 3; e < resByUri[0].data.length + 3; e++) {
            ws.cell(i, e).string(resByUri[i-2].data[e - 3])
        }
    }

    wb.write('excel.xlsx')
    console.log('Excel is writed.')
}

main()