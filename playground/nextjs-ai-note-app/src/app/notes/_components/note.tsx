"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@de100/ui/components/card";
import type { Note } from "@prisma/client";
import { useState } from "react";

import AddEditNoteDialog from "./add-edit-note-dialog";

interface NoteProps {
	note: Note;
}

export default function Note(props: NoteProps) {
	const [showEditDialog, setShowEditDialog] = useState(false);

	const wasUpdated = props.note.lastUpdatedAt > props.note.createdAt;

	const createdUpdatedAtTimestamp = (
		wasUpdated ? props.note.lastUpdatedAt : props.note.createdAt
	).toDateString();

	return (
		<>
			<Card
				className="cursor-pointer transition-shadow hover:shadow-lg"
				onClick={() => setShowEditDialog(true)}
			>
				<CardHeader>
					<CardTitle>{props.note.title}</CardTitle>
					<CardDescription>
						{createdUpdatedAtTimestamp}
						{wasUpdated && " (updated)"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="max-h-[10.5lh] overflow-y-auto whitespace-pre-line break-all">
						{props.note.content}
					</p>
				</CardContent>
			</Card>
			<AddEditNoteDialog
				open={showEditDialog}
				setOpen={setShowEditDialog}
				noteToEdit={props.note}
			/>
		</>
	);
}
