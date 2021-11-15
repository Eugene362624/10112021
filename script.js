import axios from "axios";
import xl from 'excel4node'
import xlsx from 'xlsx'

const excelFile = xlsx.readFile('./excel.xlsx')
const sheet = excelFile.Sheets[excelFile.SheetNames[0]]

const config = []
const uris = []
const hosts = []
const headers = []

for(let i = 2; i > 0; i++) {
    if (!sheet['A'+i]) break
    config.push({host: sheet['A'+i].v, headers: sheet["B"+i].v})
    uris.push(sheet["C"+i].v)
    headers.push(sheet["B"+i].v)
    hosts.push(sheet["A"+i].v)
}

async function main() {
    let requests = config.map(req => uris.map(uri => ({url: req.host + uri, headers: req.headers, uri: uri})))
    requests = requests.flat(1)
    const promises = requests.map(el => getData(el.url, el.headers))
    Promise.all(promises)
        .then(responsesArr => {
            let responses = []

            const resByUri = uris.map(e => ({ params: e.split('?')[1], data: [], match: true }))
            for (let i = 0; i < responsesArr.length; i++) {
                requests[i].response = responsesArr[i].data.length ? responsesArr[i].data : "Empty response"
                responses.push(JSON.stringify(responsesArr[i].data))
            }

            for (let i = 0; i < responses.length; i++) {
                resByUri[i % uris.length].data.push(responses[i].toString())
            }

            for (let i = 0; i < resByUri.length; i++) {
                let match = false
                resByUri[i].data.forEach((e, o) => {
                    match = (resByUri[i].data[o + 1] ? e == resByUri[i].data[o + 1] : e == resByUri[i].data[0])
                    if (!match) resByUri[i].match = false
                    if (match && !(resByUri[i].match == false)) resByUri[i].match = true
                })
            }

            writeExcel(requests, resByUri)
        })
}

function getData(url, headers) {
    console.log(url)
    return axios.get(url, {
        headers: JSON.parse(headers)
    })
}

function writeExcel(requests, resByUri) {
    let wb = new xl.Workbook()
    let ws = wb.addWorksheet('Response checker')

    //set columns width
    ws.column(1).setWidth(50)
    ws.column(2).setWidth(50)
    ws.column(3).setWidth(40)
    ws.column(4).setWidth(40)
    ws.column(6).setWidth(20)

    //set names to the columns
    ws.cell(1, 1).string('Hosts')
    ws.cell(1, 2).string('Headers')
    ws.cell(1, 3).string('Uri params')
    ws.cell(1, 4).string('Response')
    ws.cell(1, 6).string('Match by params')

    //filling hosts column by cycle
    for (let i = 2; i < hosts.length + 2; i++) {
        ws.cell(i, 1).string(hosts[i - 2])
    }

    //filling headers column 
    for (let i = 2; i < headers.length + 2; i++) {
        ws.cell(i, 2).string(headers[i-2])
    }

    // // filling uri params string column 
    for (let i = 2; i < uris.length + 2; i++) {
        ws.cell(i, 3).string(uris[i-2])
    }

    //filling responses column
    for (let i = 2; i < requests.length + 2; i++) {
        ws.cell(i, 4).string(JSON.stringify(requests[i - 2].response))
    }

    for (let i = 2; i < resByUri.length + 2; i++) {
        ws.cell(i, 6).string(resByUri[i - 2].params)
        ws.cell(i, 7).string(resByUri[i - 2].match.toString())
    }

    wb.write('excel.xlsx')
}

main()