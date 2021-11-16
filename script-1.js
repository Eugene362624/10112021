import axios from "axios";
import xlsx from 'xlsx'
import * as util from "util";

const excelFile = xlsx.readFile('./excel-new.xlsx')
const excel = excelFile.Sheets[excelFile.SheetNames[0]]

const hosts = [{
    host: "http://localhost:3001",
    header: {Authorization: "Bearer AAassdasd"}
}, {
    host: "http://localhost:3002",
    header: {Authorization: "Bearer AA442321"}
}, {
    host: "http://localhost:3003",
    header: {Authorization: "Bearer 42763271261"}
}]

const getData = function getData(url, headers) {
    return axios.get(url, {
        headers: headers
    })
}

async function main() {
    const rows = xlsx.utils.sheet_to_json(excel);

    for (let row of rows) {
        const httpReqs = hosts.map(hostConf => getData(hostConf.host + row['Uri params'], hostConf.header? hostConf.header : null));
        try {
            const results = await Promise.all(httpReqs);
            const responses = results.map(result => result.data);
            row[`Is Match`] = responses.every(item => util.isDeepStrictEqual(item, responses[0]))
            console.log(responses);
            for (let i = 0; i < responses.length; i++) {
                console.log(responses[i]);
                row[`Host ${i}`] = JSON.stringify(responses[i])
            }

            console.log(row);
        } catch(e) {
            console.log(e);
            row['Is Match'] = false;
            row['Error'] = `ERROR ${e.response.status} while loading url ${e.config.url}`
        }
    }

    let workBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workBook, xlsx.utils.json_to_sheet(rows))
    xlsx.writeFile(workBook, './excel-new-result.xlsx');
}

main()