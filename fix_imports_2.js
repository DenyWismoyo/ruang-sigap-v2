const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src/app/dashboard');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [from, to] of replacements) {
        content = content.replace(from, to);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

replaceInFile(
    path.join(dashboardPath, '(main)/tugas/delegasi/page.tsx'),
    [[ /'@\/app\/dashboard\/components\/TaskDetailModal'/g, "'@/app/dashboard/(main)/tugas/components/TaskDetailModal'" ]]
);

replaceInFile(
    path.join(dashboardPath, '(main)/tugas/components/TaskDetailModal.tsx'),
    [
        [ /from\s+'\.\.\/\.\.\/\.\.\/\.\.\/context\/AuthContext'/g, "from '@/context/AuthContext'" ],
        [ /from\s+'@\/app\/dashboard\/components\/ui\/([a-zA-Z0-9-]+)'/g, "from '@/components/ui/$1'" ]
    ]
);

replaceInFile(
    path.join(dashboardPath, 'components/TaskSummaryWidget.tsx'),
    [
        [ /from\s+'\.\.\/tugas\/components\/TaskListItem'/g, "from '@/app/dashboard/(main)/tugas/components/TaskListItem'" ],
        [ /from\s+'\.\.\/tugas\/components\/TaskDetailModal'/g, "from '@/app/dashboard/(main)/tugas/components/TaskDetailModal'" ]
    ]
);

replaceInFile(
    path.join(dashboardPath, '(main)/talenta/tabs/CompetencyTab.tsx'),
    [[ /'@\/app\/dashboard\/components\/PlanCreationModal'/g, "'@/app/dashboard/(main)/talenta/components/PlanCreationModal'" ]]
);

replaceInFile(
    path.join(dashboardPath, '(main)/talenta/tabs/DashboardTab.tsx'),
    [[ /'@\/app\/dashboard\/components\/MatrixBox'/g, "'@/app/dashboard/(main)/talenta/components/MatrixBox'" ]]
);

replaceInFile(
    path.join(dashboardPath, '(main)/talenta/tabs/SuccessionTab.tsx'),
    [
        [ /'@\/app\/dashboard\/components\/succession\/JobProjectionView'/g, "'@/app/dashboard/(main)/talenta/components/succession/JobProjectionView'" ],
        [ /'@\/app\/dashboard\/components\/succession\/CandidateAnalysisView'/g, "'@/app/dashboard/(main)/talenta/components/succession/CandidateAnalysisView'" ]
    ]
);

replaceInFile(
    path.join(dashboardPath, 'hooks/useSuccessionData.ts'),
    [[ /from\s+'\.\.\/talenta\/data\/succession-constants'/g, "from '@/app/dashboard/(main)/talenta/data/succession-constants'" ]]
);

console.log("Done fixing imports.");
