const fs = require('fs');
const path = require('path');

const filesToDelete = [
  "src/components/ActivityFeed.tsx",
  "src/components/AlertBanner.tsx",
  "src/components/AnalyticsDashboardGrid.tsx",
  "src/components/AvatarRing.tsx",
  "src/components/BottomSheet.tsx",
  "src/components/CandlestickChart.tsx",
  "src/components/CommandPalette.tsx",
  "src/components/ComparisonBar.tsx",
  "src/components/CopilotPanel.tsx",
  "src/components/DarkStatCard.tsx",
  "src/components/DataRingProgress.tsx",
  "src/components/DataTable.tsx",
  "src/components/EmptyStatePlaceholder.tsx",
  "src/components/FilterBar.tsx",
  "src/components/FilterChipGroup.tsx",
  "src/components/FloatingCard.tsx",
  "src/components/GradientBadge.tsx",
  "src/components/HeatmapCard.tsx",
  "src/components/HeatmapGrid.tsx",
  "src/components/HoverCard.tsx",
  "src/components/InlineAlert.tsx",
  "src/components/InteractiveHoverButton.tsx",
  "src/components/LeaderboardPanel.tsx",
  "src/components/LoadingSpinner.tsx",
  "src/components/MetricGaugeCard.tsx",
  "src/components/MobileTabBar.tsx",
  "src/components/NotificationDot.tsx",
  "src/components/OmnifitDialog.tsx",
  "src/components/OmnifitFormSection.tsx",
  "src/components/OmnifitSelect.tsx",
  "src/components/OmnifitTextarea.tsx",
  "src/components/PageHeader.tsx",
  "src/components/ParticleBackground.tsx",
  "src/components/PDFExportButton.tsx",
  "src/components/PricingCard.tsx",
  "src/components/ProgressBar.tsx",
  "src/components/ProgressMilestone.tsx",
  "src/components/PulseStatCard.tsx",
  "src/components/RadarChart.tsx",
  "src/components/RichMarkdownRenderer.tsx",
  "src/components/ScoreRingCard.tsx",
  "src/components/ScrollNavbar.tsx",
  "src/components/SectionPanel.tsx",
  "src/components/SkeletonLoader.tsx",
  "src/components/SparklineCard.tsx",
  "src/components/StepTimeline.tsx",
  "src/components/SubscriptionGate.tsx",
  "src/components/TechStackBar.tsx",
  "src/components/TickerTape.tsx",
  "src/components/TimelineEvent.tsx",
  "src/components/TrendPanel.tsx",
  "src/components/TypingText.tsx",
  "src/components/WizardStepper.tsx",
  "src/components/ui/app-data-display.tsx",
  "src/components/ui/design-system.tsx"
];

for (const file of filesToDelete) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log("Deleted:", file);
  }
}
