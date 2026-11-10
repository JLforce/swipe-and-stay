
import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../../constants/brand";
import type { AdminListingPreview } from "../../data/adminListingPreview";

interface RejectListingModalProps {
  visible: boolean;
  listing: AdminListingPreview | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function RejectListingModal({
  visible,
  listing,
  onClose,
  onSubmit,
}: RejectListingModalProps) {
  const [reason, setReason] = useState("");


  const trimmedReason = reason.trim();
  const canSubmit = trimmedReason.length > 0;

  function handleSubmit() {
    if (!canSubmit || !listing) return;

    onSubmit(trimmedReason);
    setReason("");
  }

  function handleClose() {
    setReason("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-5">
        <View className="w-full max-w-lg gap-4 rounded-3xl bg-background p-5">
          <View className="gap-1">
            <Text className="text-lg font-extrabold text-foreground">
              Reject listing
            </Text>
            <Text className="text-sm leading-5 text-muted-foreground">
              Provide a clear reason so the Owner understands why this
              property was rejected.
            </Text>
          </View>

          {listing ? (
            <View className="rounded-xl bg-secondary p-3">
              <Text className="text-xs font-semibold text-muted-foreground">
                Property
              </Text>
              <Text className="mt-1 text-sm font-bold text-foreground">
                {listing.title}
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                {listing.owner.name}
              </Text>
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">
              Rejection reason
              <Text className="text-destructive"> *</Text>
            </Text>

            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Explain what needs to be corrected or provided..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              className="min-h-32 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
            />

            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">
                A rejection reason is required.
              </Text>
              <Text className="text-xs text-muted-foreground">
                {reason.length}/1000
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={handleClose}
              className="flex-1 items-center justify-center rounded-xl border border-border px-4 py-3"
            >
              <Text className="text-sm font-bold text-foreground">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 items-center justify-center rounded-xl px-4 py-3 ${
                canSubmit ? "bg-destructive" : "bg-muted"
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  canSubmit ? "text-white" : "text-muted-foreground"
                }`}
              >
                Confirm rejection
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

