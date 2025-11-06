import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ } from "@/context/AppContext";
import { HelpCircle } from "lucide-react";

interface FAQItemProps {
  faq: FAQ;
  onClick?: () => void;
}

export const FAQItem = ({ faq, onClick }: FAQItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/faq/${faq.id}`);
    }
  };

  return (
    <AccordionItem value={faq.id}>
      <AccordionTrigger
        className="text-left hover:text-primary transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
          {faq.question}
        </div>
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground">
        {faq.answer}
      </AccordionContent>
    </AccordionItem>
  );
};
