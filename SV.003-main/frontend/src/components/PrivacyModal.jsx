import React from "react";
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
            Privacidad y Uso de Datos
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-left text-sm text-muted-foreground">
              <p className="mb-3">
                GUIAA se compromete a proteger tu privacidad y la de tus
                mascotas. Al usar esta plataforma:
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  Los datos de las consultas se almacenan de forma segura y
                  encriptada
                </li>
                <li>Solo tú tienes acceso a la información de tus mascotas</li>
                <li>
                  No compartimos información con terceros sin tu consentimiento
                </li>
                <li>Cumplimos con todas las normativas de protección de datos</li>
                <li>
                  Puedes solicitar la eliminación de tus datos en cualquier
                  momento
                </li>
              </ul>
              <p className="mt-3">
                Para más información, consulta nuestra{" "}
                <a
                  href="#"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Política de Privacidad
                </a>
                .
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onAccept}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
