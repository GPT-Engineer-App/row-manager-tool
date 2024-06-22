import React, { useState } from "react";
import { Container, VStack, Button, Input, Table, Thead, Tbody, Tr, Th, Td, IconButton, Select } from "@chakra-ui/react";
import { FaTrash, FaPlus } from "react-icons/fa";
import Papa from "papaparse";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";

const Index = () => {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState("edited_data.csv");
  const [secondFileData, setSecondFileData] = useState([]);
  const [secondFileHeaders, setSecondFileHeaders] = useState([]);
  const [joinColumn, setJoinColumn] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setHeaders(result.meta.fields);
          setData(result.data);
        },
      });
    }
  };

  const handleSecondFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = json[0];
        const rows = json.slice(1).map((row) => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index];
          });
          return rowData;
        });
        setSecondFileHeaders(headers);
        setSecondFileData(rows);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleAddRow = () => {
    setData([...data, {}]);
  };

  const handleRemoveRow = (index) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  };

  const handleCellChange = (rowIndex, columnId, value) => {
    const newData = data.map((row, i) => {
      if (i === rowIndex) {
        return { ...row, [columnId]: value };
      }
      return row;
    });
    setData(newData);
  };

  const handleJoinFiles = () => {
    if (!joinColumn) {
      alert("Please select a column to join on.");
      return;
    }

    const joinedData = data.map((row) => {
      const matchingRow = secondFileData.find((secondRow) => secondRow[joinColumn] === row[joinColumn]);
      return { ...row, ...matchingRow };
    });

    const joinedHeaders = Array.from(new Set([...headers, ...secondFileHeaders]));

    setHeaders(joinedHeaders);
    setData(joinedData);
  };

  return (
    <Container centerContent maxW="container.xl" py={10}>
      <VStack spacing={4} width="100%">
        <Input type="file" accept=".csv" onChange={handleFileUpload} />
        <Input type="file" accept=".csv, .xlsx" onChange={handleSecondFileUpload} />
        <Select placeholder="Select column to join on" onChange={(e) => setJoinColumn(e.target.value)}>
          {headers.map((header, index) => (
            <option key={index} value={header}>
              {header}
            </option>
          ))}
        </Select>
        <Button onClick={handleJoinFiles}>Join Files</Button>
        <Button onClick={handleAddRow} leftIcon={<FaPlus />}>
          Add Row
        </Button>
        <Table variant="simple">
          <Thead>
            <Tr>
              {headers.map((header, index) => (
                <Th key={index}>{header}</Th>
              ))}
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, rowIndex) => (
              <Tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <Td key={colIndex}>
                    <Input
                      value={row[header] || ""}
                      onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                    />
                  </Td>
                ))}
                <Td>
                  <IconButton
                    aria-label="Remove Row"
                    icon={<FaTrash />}
                    onClick={() => handleRemoveRow(rowIndex)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <CSVLink data={data} headers={headers} filename={fileName}>
          <Button>Download CSV</Button>
        </CSVLink>
      </VStack>
    </Container>
  );
};

export default Index;