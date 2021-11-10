import axios from "axios";
import xl from 'excel4node'

async function main(...args) {

    let responses = []
    let dirtyParams = []
    let cleanParams = []
    let promises = args.map(url => getData(url, responses))
    Promise.all(promises)
        .then(res => {
            res.map(e => console.log(e.data))
            // responses = res[0].responses


            // for (let i = 0; i < args.length; i++) {
            //     dirtyParams.push(args[i].split("?")[1])
            // }
            // dirtyParams.map(e => cleanParams.push(e.split('&')))
            // excel(args, responses, cleanParams)

        }
        )
}

async function getData(url, responses) {
    return await axios.get(url)
        // .then(res => res.data.length ? responses.push(res.data) : responses.push(["Пустой ответ"]))
    // return { responses }
}

function excel(args, responses, cleanParams) {

    let wb = new xl.Workbook()
    let ws = wb.addWorksheet('Response checker')

    let isMatch = false

    if (args.length > 1) {
        for (let i = 0; i < args.length; i++) {
            responses[0].toString() == responses[i].toString() ? isMatch = true : isMatch = false
        }
    }

    //set columns width
    ws.column(1).setWidth(50)
    ws.column(2).setWidth(40)
    ws.column(3).setWidth(40)
    ws.column(4).setWidth(20)

    //set names to the columns
    ws.cell(1, 1).string('Url request string')
    ws.cell(1, 2).string('Url params')
    ws.cell(1, 3).string('Response')
    ws.cell(1, 4).string('Match for all')

    //filling url params column by cycle
    for (let i = 2; i < cleanParams.length + 2; i++) {
        ws.cell(i, 2).string(`${cleanParams[i - 2].join(', ')}`)
    }

    //filling url request string column 
    for (let i = 2; i < args.length + 2; i++) {
        ws.cell(i, 1).string(`${args[i - 2]}`)
    }

    //filling responses column
    for (let i = 2; i < responses.length + 2; i++) {
        ws.cell(i, 3).string(responses[i - 2].toString())
    }

    //filling match column
    isMatch ? ws.cell(2, 4).string('Ответы совпали') : ws.cell(2, 4).string('Ответы не совпали')

    wb.write('excel.xlsx')
}

main('http://localhost:3000/api?page=1&stream=false', 'http://localhost:3000/api?page=1&stream=true', 'http://localhost:3000/api?page=2&stream=false')