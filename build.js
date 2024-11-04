import { promises as fs } from 'fs';
import path from 'path';
import { minify } from 'terser'; // Use terser for more control over minification

const watch_folders = ["css", "js"];
const source_folder = "src";
const output_folder = "dist";

// Function to delete the output folder if it exists
async function cleanOutputFolder() {
    try {
        await fs.rm(output_folder, { recursive: true, force: true });
        console.log(`${output_folder} deleted.`);
    } catch (err) {
        console.error(`Error deleting ${output_folder}:`, err);
    }
}

// Function to copy files
async function copyFile(source, destination) {
    await fs.copyFile(source, destination);
    console.log(`Copied: ${source} to ${destination}`);
}

// Function to process files in a directory (including subdirectories)
async function processWatchFolder(watchFolderPath, distPath) {
    const entries = await fs.readdir(watchFolderPath, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(watchFolderPath, entry.name);
        const distFilePath = path.join(distPath, entry.name);

        if (entry.isDirectory()) {
            // Recursively process subdirectories
            await fs.mkdir(distFilePath, { recursive: true });
            await processWatchFolder(sourcePath, distFilePath);
        } else if (entry.isFile()) {
            try {
                const fileStat = await fs.stat(sourcePath);
                if (fileStat.size === 0) {
                    console.warn(`Skipping empty file: ${sourcePath}`);
                    continue; // Skip empty files
                }

                // Log the file path before processing
                console.log(`Processing: ${sourcePath}`);

                // Check file type and process accordingly
                if (entry.name.endsWith('.js')) {
                    const fileContent = await fs.readFile(sourcePath, 'utf-8');

                    const minifiedContent = await minify(fileContent, {
                        mangle: false, // Keep function and variable names
                        compress: {
                            drop_console: false, // Keep console statements
                            toplevel: false // Do not drop top-level variables
                        },
                        output: {
                            beautify: false, // Output as one line
                            comments: false // Remove comments
                        }
                    });

                    await fs.writeFile(distFilePath, minifiedContent.code);
                    console.log(`Minified and copied: ${sourcePath} to ${distFilePath}`);
                } else if (entry.name.endsWith('.css')) {
                    // Directly copy CSS files without minification
                    await copyFile(sourcePath, distFilePath);
                } else {
                    await copyFile(sourcePath, distFilePath); // Copy other files as is
                }
            } catch (err) {
                console.error(`Error processing file ${sourcePath}:`, err);
            }
        }
    }
}


// Function to process the source folder
async function processSourceFolder() {
    const entries = await fs.readdir(source_folder, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(source_folder, entry.name);
        const distPath = path.join(output_folder, entry.name);

        // If entry is a folder and not in watch folders, copy it
        if (entry.isDirectory() && !watch_folders.includes(entry.name)) {
            await fs.mkdir(distPath, { recursive: true });
            await fs.cp(sourcePath, distPath, { recursive: true });
            console.log(`Copied directory: ${sourcePath} to ${distPath}`);
            continue;
        }

        // If entry is a file, copy it
        if (entry.isFile()) {
            await copyFile(sourcePath, distPath);
            continue;
        }

        // If entry is in watch folders, process it
        if (entry.isDirectory() && watch_folders.includes(entry.name)) {
            await fs.mkdir(distPath, { recursive: true });
            await processWatchFolder(sourcePath, distPath);
        }
    }
}

// Main function
async function main() {
    await cleanOutputFolder();
    await fs.mkdir(output_folder, { recursive: true });
    await processSourceFolder();
}

main().catch(console.error);
