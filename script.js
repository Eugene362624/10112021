import axios from "axios";
import xl from 'excel4node'

async function main(...uris) {
    const hosts = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
    let promises = []
    let requestsUrls = []
    hosts.map(host => uris.map(uri => requestsUrls.push(host+uri)))
    promises = requestsUrls.map(url => getData(url))
    Promise.all(promises)
        .then(responsesArr => {
            let responses = []
            let dirtyParams = []
            let cleanParams = []
            let requests = []
            let resByUri = [{}]
            let isMatch = false

            responsesArr.map(e => {
                requests.push(e.config.url)
                e.data.length ? responses.push(e.data) : responses.push(['Пустой ответ'])
                dirtyParams.push(e.config.url.split('?')[1])
            })

            console.log(resByUri)

            // pushing to the clean params arr
            dirtyParams.map(e => cleanParams.push(e.split("&").join(', ')))

            // checking match for all
            for (let i = 0; i<responses.length; i++) {
                responses[0].toString() == responses[i].toString() ? isMatch = true : isMatch = false
            }

            excel(responses, cleanParams, isMatch, requests)
        })
}

function getData(url) {
    return axios.get(url)
}

function excel(responses, cleanParams, isMatch, requests) {

    let wb = new xl.Workbook()
    let ws = wb.addWorksheet('Response checker')

    //set columns width
    ws.column(1).setWidth(50)
    ws.column(2).setWidth(40)
    ws.column(3).setWidth(40)
    ws.column(4).setWidth(20)
    ws.column(5).setWidth(20)

    //set names to the columns
    ws.cell(1, 1).string('Url request string')
    ws.cell(1, 2).string('Uri params')
    ws.cell(1, 3).string('Response')
    ws.cell(1, 4).string('Match for all')
    ws.cell(1, 5).string('Match by params')

    //filling url params column by cycle
    for(let i = 2; i<requests.length+2; i++) {
        ws.cell(i, 1).string(requests[i-2])
    }

    //filling uri params string column 
    for (let i = 2; i < cleanParams.length + 2; i++) {
        ws.cell(i, 2).string(`${cleanParams[i - 2]}`)
    }

    //filling responses column
    for (let i = 2; i < responses.length + 2; i++) {
        ws.cell(i, 3).string(responses[i - 2].toString())
    }

    //filling match column
    isMatch ? ws.cell(2, 4).string('Ответы совпали') : ws.cell(2, 4).string('Ответы не совпали')

    wb.write('excel.xlsx')
}

main('/api?page=1&stream=false', '/api?page=1&stream=true', '/api?page=2&stream=false')