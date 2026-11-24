import { debugForFile } from "debug-for-file";

import { nullThrows } from "@flint.fyi/utils";

import type { FileChange } from "../types/changes.ts";
import type { LinterHost } from "../types/host.ts";
import { applyChangesToText } from "./applyChangesToText.ts";

const log = debugForFile(import.meta.url);

/**
 * Applies changes to a file on disk, unless the file no longer contains
 * `expectedSourceText`: the text the changes' ranges were computed against.
 * @returns Whether the file was written.
 */
export async function applyChangesToFile(
	host: LinterHost,
	absoluteFilePath: string,
	changes: FileChange[],
	expectedSourceText?: string,
): Promise<boolean> {
	log(
		"Collecting %d changes to apply to file: %s",
		changes.length,
		absoluteFilePath,
	);

	const fileContent = nullThrows(
		await host.readFile(absoluteFilePath),
		"Expected linted file to exist.",
	);

	if (expectedSourceText !== undefined && fileContent !== expectedSourceText) {
		log(
			"Skipping changes to file modified since linting: %s",
			absoluteFilePath,
		);
		return false;
	}

	log("Writing %d changes to file: %s", changes.length, absoluteFilePath);

	await host.writeFile(
		absoluteFilePath,
		applyChangesToText(changes, fileContent),
	);

	log("Wrote changes to file: %s", absoluteFilePath);

	return true;
}
