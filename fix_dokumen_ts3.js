const fs = require('fs');

const replaceInFile = (file, replacements) => {
    let content = fs.readFileSync(file, 'utf8');
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
};

const dir = 'src/app/dashboard/poros/(main)/dokumen/components/';

replaceInFile(dir + 'RepositoryContextMenu.tsx', [
    [/import \{ DokumenFolder, DokumenLink \} from "@\/types";/g, 'import { RepositoryItem } from "@/types";'],
    [/type RepositoryItemCombined = \(DokumenFolder & \{ type: 'folder' \}\) \| \(DokumenLink & \{ type: 'link' \}\);/g, 'type RepositoryItemCombined = RepositoryItem;'],
    [/item\.type/g, 'item.tipe'],
    [/\(item as DokumenLink\)\./g, 'item.'],
]);

replaceInFile(dir + 'RepositoryItem.tsx', [
    [/import \{ DokumenFolder, DokumenLink, DocumentIconType \} from "@\/types";/g, 'import { RepositoryItem, DocumentIconType } from "@/types";'],
    [/type RepositoryItemCombined = \(DokumenFolder & \{ type: 'folder' \}\) \| \(DokumenLink & \{ type: 'link' \}\);/g, 'type RepositoryItemCombined = RepositoryItem;'],
    [/item\.type === 'folder' \? item\.namaFolder : item\.namaDokumen/g, 'item.nama'],
    [/item\.type/g, 'item.tipe'],
    [/\(item as DokumenLink\)\./g, 'item.'],
]);

replaceInFile(dir + 'RepositoryList.tsx', [
    [/import \{ DokumenFolder, DokumenLink \} from "@\/types";/g, 'import { RepositoryItem } from "@/types";'],
    [/type RepositoryItemCombined = \(DokumenFolder & \{ type: 'folder' \}\) \| \(DokumenLink & \{ type: 'link' \}\);/g, 'type RepositoryItemCombined = RepositoryItem;'],
    [/item\.type === 'folder' \? item\.namaFolder : item\.namaDokumen/g, 'item.nama'],
    [/item\.type/g, 'item.tipe'],
    [/\(item as DokumenLink\)\./g, 'item.'],
    [/handleDrop = \(e\) =>/g, 'handleDrop = (e: any) =>'],
    [/onDragOver=\{\(e\) =>/g, 'onDragOver={(e: any) =>'],
]);

replaceInFile(dir + 'RepositoryView.tsx', [
    [/import \{ DokumenFolder, DokumenLink, DocumentIconType \} from "@\/types";/g, 'import { RepositoryItem, DocumentIconType } from "@/types";'],
    [/type RepositoryItemCombined = \(DokumenFolder & \{ type: 'folder' \}\) \| \(DokumenLink & \{ type: 'link' \}\);/g, 'type RepositoryItemCombined = RepositoryItem;'],
    [/item\.type === 'folder' \? item\.namaFolder : item\.namaDokumen/g, 'item.nama'],
    [/item\.type/g, 'item.tipe'],
    [/\(item as DokumenLink\)\./g, 'item.'],
    [/\(parent as DokumenFolder\)\./g, 'parent.'],
    [/parent\.type/g, 'parent.tipe'],
]);

replaceInFile(dir + 'ShareModal.tsx', [
    [/import \{ DokumenFolder, DokumenLink \} from "@\/types";/g, 'import { RepositoryItem } from "@/types";'],
    [/type RepositoryItemCombined = \(DokumenFolder & \{ type: 'folder' \}\) \| \(DokumenLink & \{ type: 'link' \}\);/g, 'type RepositoryItemCombined = RepositoryItem;'],
    [/item\.type === 'folder' \? item\.namaFolder : item\.namaDokumen/g, 'item.nama'],
    [/item\.type/g, 'item.tipe'],
    [/\(item as DokumenLink\)\./g, 'item.'],
]);
