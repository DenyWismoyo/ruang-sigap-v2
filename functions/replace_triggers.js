const fs = require('fs');

const path = 'd:\\Project\\RUANG SIGAP\\functions\\src\\triggers\\index.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `                            let hours = 9, minutes = 0;
                            try { [hours, minutes] = suratData.detailAgenda.jam.split(":").map(Number); }
                            catch (e) { logger.warn(\`Could not parse time "\${suratData.detailAgenda.jam}". Defaulting to 9:00.\`); }`;

const replace1 = `                            let hours = 9, minutes = 0;
                            try {
                                if (suratData.detailAgenda.jam && typeof suratData.detailAgenda.jam === 'string') {
                                    const parsed = suratData.detailAgenda.jam.split(":").map(Number);
                                    if (!isNaN(parsed[0]) && !isNaN(parsed[1])) {
                                        [hours, minutes] = parsed;
                                    } else {
                                        throw new Error("Invalid time format");
                                    }
                                }
                            }
                            catch (e) { logger.warn(\`Could not parse time "\${suratData.detailAgenda?.jam}". Defaulting to 9:00.\`); }`;

const target2 = `                            if (suratData.detailAgenda.jamSelesai) {
                                try {
                                    const [endHours, endMinutes] = suratData.detailAgenda.jamSelesai.split(":").map(Number);
                                    const endDate = suratData.detailAgenda.tanggal.toDate();
                                    endDate.setHours(endHours, endMinutes);
                                    endTime = createRfc3339DateTimeWIB(endDate);
                                } catch (e) {
                                    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 jam
                                    endTime = createRfc3339DateTimeWIB(endDate);
                                }`;

const replace2 = `                            if (suratData.detailAgenda.jamSelesai && typeof suratData.detailAgenda.jamSelesai === 'string') {
                                try {
                                    const parsed = suratData.detailAgenda.jamSelesai.split(":").map(Number);
                                    if (!isNaN(parsed[0]) && !isNaN(parsed[1])) {
                                        const [endHours, endMinutes] = parsed;
                                        const endDate = suratData.detailAgenda.tanggal.toDate();
                                        endDate.setHours(endHours, endMinutes);
                                        endTime = createRfc3339DateTimeWIB(endDate);
                                    } else {
                                        throw new Error("Invalid end time format");
                                    }
                                } catch (e) {
                                    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 jam
                                    endTime = createRfc3339DateTimeWIB(endDate);
                                }`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);

fs.writeFileSync(path, code);
console.log("Done");
