import { ConversationList } from "../../components/ConversationList";
import { OwnerStatsGrid } from "../../components/OwnerStats";

export default function OwnerInquiries() {
  return (
    <ConversationList
      header={<OwnerStatsGrid />}
      emptyText="No inquiries yet. When a student messages you about a listing, it shows up here."
      actionLabel="Reply"
    />
  );
}
