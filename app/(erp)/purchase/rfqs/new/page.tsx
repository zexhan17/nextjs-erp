import { getVendorsAction } from "../../actions";
import { RFQForm } from "./rfq-form";

export default async function NewRFQPage() {
    const vendors = await getVendorsAction();
    return <RFQForm vendors={vendors} />;
}
