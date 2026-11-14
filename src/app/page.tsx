import { Floor } from "@/features/home/Floor";
import { buildFloor } from "@/features/home/model";
import { sampleWorkspace } from "../../fixtures/home-sample";

// Home: the Floor. Reads the sample workspace for now; Part 3 swaps this for
// src/lib/data without changing the Floor's components.
export default function HomePage() {
  return <Floor model={buildFloor(sampleWorkspace)} />;
}
