import { getContactAction } from "../../actions";
import { ContactForm } from "../../contact-form";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditContactPage({ params }: Props) {
    const { id } = await params;
    const contact = await getContactAction(id);
    if (!contact) notFound();

    return <ContactForm contact={contact} />;
}
