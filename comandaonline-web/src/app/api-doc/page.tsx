// import { getApiDocs } from "../../../lib/swagger";
// import ReactSwagger from "./react-swagger";

// export default async function IndexPage() {
//   const spec = await getApiDocs();
//   return (
//     <div className="prose max-w-none bg-white text-black p-4 w-full h-full">
//       {/* <section className="container"> */}
//       <ReactSwagger spec={spec} />
//       {/* </section> */}
//     </div>
//   );
// }

export default async function IndexPage() {
  return (
    <div className="prose max-w-none bg-white text-black p-4 w-full h-full">
      <h1>API Documentation</h1>
    </div>
  );
}
