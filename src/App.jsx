import { useState, useEffect } from "react";

import "./App.css";
import Header from "./components/Header";

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const BASE_ID = import.meta.env.VITE_BASE_ID;
const TABLE_ID1 = import.meta.env.VITE_TABLE_ID_P1P2;

function App() {
    const [icsInfo, setIcsInfo] = useState([""]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getInfoForIcs() {
            const data = await fetchAirtableP1P2();
            if (data) {
                setIcsInfo(data);
                setLoading(false);
            }
            console.log("Retrieved data", data);
        }
        getInfoForIcs();
    }, []);

    async function fetchAirtableP1P2() {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID1}`;
        const headers = {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
        };

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: headers,
            });
            const data = await response.json();
            console.log(data);
            return data;
        } catch (error) {
            console.log(`Something went wrong, Error: ${error.message}`);
        }
    }

    function generateIcs(eventTimes) {
        let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Your Organization//NONSGML v1.0//EN\r\n`;

        eventTimes.forEach((event) => {
            const {
                EvenDate1,
                EvenDate2,
                OddDate1,
                OddDate2,
                PillarTitle,
                PillarDesc,
                PillarNum,
                WeekEvenLab2,
                WeekOddLab1,
            } = event.fields;

            const formatDate = (dateStr) => {
                if (!dateStr) return null;
                const date = new Date(dateStr);
                return (
                    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
                );
            };

            const foldLine = (line) => {
                // Fold long lines at 75 characters
                if (line.length <= 75) return line;
                return line.slice(0, 75) + "\r\n " + foldLine(line.slice(75));
            };

            const addEvent = (summary, start, end, description, categories) => {
                if (start && end) {
                    icsContent += foldLine(`BEGIN:VEVENT\r\n`);
                    icsContent += foldLine(`SUMMARY:${summary}\r\n`);
                    icsContent += foldLine(`DTSTART:${start}\r\n`);
                    icsContent += foldLine(`DTEND:${end}\r\n`);
                    icsContent += foldLine(`DESCRIPTION:${description}\r\n`);
                    icsContent += foldLine(`LOCATION:Online or TBD\r\n`);
                    icsContent += foldLine(`CATEGORIES:${categories}\r\n`);
                    icsContent += foldLine(`END:VEVENT\r\n`);
                }
            };

            addEvent(
                `${PillarTitle} - ${WeekEvenLab2}`,
                formatDate(EvenDate1),
                formatDate(EvenDate2),
                PillarDesc || "No description",
                PillarNum
            );

            addEvent(
                `${PillarTitle} - ${WeekOddLab1}`,
                formatDate(OddDate1),
                formatDate(OddDate2),
                PillarDesc || "No description",
                PillarNum
            );
        });

        icsContent += `END:VCALENDAR\r\n`;

        return icsContent;
    }

    function triggerIcsDownload(content) {
        const blob = new Blob([content], { type: "text/calendar" }); //store data as binary in browser memory
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "calendar-info.ics";
        link.click(); //to activate the download, give it functionality
    }

    function handleIcsDownload() {
        console.log("icsInfo state:", icsInfo); // Log the value of icsInfo
        const icsContent = generateIcs(icsInfo.records);
        console.log(icsContent);
        triggerIcsDownload(icsContent);
    }

    return (
        <div className="download-area">
            <Header />
            <button onClick={handleIcsDownload} disabled={loading}>
                {loading ? "Loading..." : "Download .ics File"}
            </button>
        </div>
    );
}

export default App;
