import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PrivacyModal({ isOpen, onAccept }) {
  const { t } = useTranslation("legal");
  const items = t("privacyModal.items", { returnObjects: true });

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="[&>button.absolute]:hidden sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span aria-hidden>🔒</span>
            {t("privacyModal.title")}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-left text-sm text-muted-foreground">
              <p className="mb-3">{t("privacyModal.intro")}</p>
              <ul className="list-disc space-y-1 pl-4">
                {Array.isArray(items) &&
                  items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-3">
                {t("privacyModal.moreInfo")}{" "}
                <a
                  href="#"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  {t("privacyModal.policyLink")}
                </a>
                .
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onAccept}>
            {t("privacyModal.accept")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
